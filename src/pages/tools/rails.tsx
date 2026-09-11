import React, { useEffect, useState, useRef } from "react";
import {
  Add,
  Check,
  Close,
  Delete,
  ModeEdit,
  PanTool,
  Place,
} from "@mui/icons-material";
import { hsvToRgb } from "@/chord/model";

type XY = {
  x: number;
  y: number;
};

type RoutePoint = XY & {
  length: number | null; // 点(x,y) -> 直線(length) -> 次の点に向かう曲線(円弧) -> ...
};

type HSV = {
  h: number;
  s: number;
  v: number;
}

// 元データ(長さ系の単位は基本m)
type Route = {
  name: string;
  startDirection: number | null; // rad
  points: RoutePoint[];
  stations: {
    distance: number;
    name: string;
    number: string;
    nameLabelHidden: boolean;
    nameLabelPosition: XY; // 相対px
    numberLabelPosition: XY; // 相対px
    length: number;
    width: number;
    left: number; // 中心からのずれ(進行左方向)
    platform: string; // 進行左からホーム有無 ex: 101(相対) 010(島) 1010
  }[];
  startLayer: number; // 0-2 (地下～高架)
  layerChangePoints: {
    distance: number;
    upper: boolean;
  }[];
  color: HSV;
  width: number; // px
};

const METER_PER_PX = 5;
const meter = (px: number) => px * METER_PER_PX;
const px = (meter: number) => meter / METER_PER_PX;

const calcPath = (startDirection: number, points: RoutePoint[]) => {
  const svgParts: string[] = [];
  let direction = startDirection;
  let lastX; let lastY;
  let lastRadius; let lastCx; let lastCy;
  for (const [i, point] of points.entries()) {
    if (i == 0) {
      svgParts.push(`M${px(point.x)} ${px(point.y)}`);
      lastX = point.x; lastY = point.y;
    }
    // 点 -> 直線
    const midX = point.x + (point.length ?? 0) * Math.cos(direction);
    const midY = point.y + (point.length ?? 0) * Math.sin(direction);
    svgParts.push(`L${px(midX)} ${px(midY)}`);
    lastX = midX; lastY = midY;
    // 直線 -> 曲線 -> 次の点
    if (i == points.length - 1) continue;
    const nextX = points[i + 1].x;
    const nextY = points[i + 1].y;
    const nx = -Math.sin(direction); // 現在の方向に垂直
    const ny = Math.cos(direction);
    const vx = nextX - midX;
    const vy = nextY - midY;
    const dot = nx * vx + ny * vy;
    if (dot == 0) {
      svgParts.push(`L${px(nextX)} ${px(nextY)}`);
      lastX = nextX; lastY = nextY;
      continue;
    }
    const r = (vx ** 2 + vy ** 2) / (2 * dot);
    const cx = midX + r * nx; // 中心
    const cy = midY + r * ny;
    const startAngle = Math.atan2(midY - cy, midX - cx);
    const endAngle = Math.atan2(nextY - cy, nextX - cx);
    const isLargeArc = r > 0 ? (endAngle + (endAngle < startAngle ? Math.PI * 2 : 0) - startAngle) > Math.PI :
      (startAngle + (startAngle < endAngle ? Math.PI * 2 : 0) - endAngle) > Math.PI;
    const isClockwise = r > 0; // SVG上
    svgParts.push(`A${px(r)} ${px(r)} 0 ${isLargeArc ? "1": "0"} ${isClockwise ? "1" : "0"} ${px(nextX)} ${px(nextY)}`);
    direction = r > 0 ? Math.atan2(nextX - cx, -(nextY - cy)) : Math.atan2(-(nextX - cx), nextY - cy);
    lastX = nextX; lastY = nextY;
    lastRadius = r; lastCx = cx; lastCy = cy;
  };
  return {
    svgPath: svgParts.join(""),
    lastX, lastY,
    lastDirection: direction,
    lastRadius, lastCx, lastCy,
  };
};

const calcNextRoute = (r: Route, x: number, y: number, addLength?: number) => {
  const route = { ...r, points: r.points.map(p => ({ ...p })) };
  const lastPoint = route.points[route.points.length - 1];
  if (!lastPoint || lastPoint.length !== null) { // 次の点
    route.points.push({ x, y, length: addLength ?? null });
  } else { // 直線長さ
    const direction = route.startDirection !== null ? calcPath(route.startDirection, route.points).lastDirection : null;
    const vx = x - lastPoint.x;
    const vy = y - lastPoint.y;
    if (direction === null) {
      route.points[route.points.length - 1].length = (vx ** 2 + vy ** 2) ** 0.5;
      route.startDirection = Math.atan2(vy, vx);
    } else {
      const dx = Math.cos(direction);
      const dy = Math.sin(direction);
      route.points[route.points.length - 1].length = Math.max(vx * dx + vy * dy, 0);
    }
  }
  return route;
};

const calcPrevRoute = (r: Route) => {
  const route = { ...r, points: r.points.map(p => ({ ...p })) };
  const lastPoint = route.points[route.points.length - 1];
  if (!lastPoint) return r;
  if (lastPoint.length !== null) { // 直線削除
    route.points[route.points.length - 1].length = null;
    if (route.points.length == 1) {
      route.startDirection = null;
    }
  } else { // 点削除
    route.points = route.points.slice(0, route.points.length - 1);
  }
  return route;
};

const calcNearestPathPoint = (path: SVGPathElement, x: number, y: number, width: number = 0) => {
  const length = path.getTotalLength();
  const minD = Math.min(width / 2, length);
  const maxD = Math.max(length - (width / 2), 0);
  // 雑め
  const roughStep = 10
  let minDistance = Infinity;
  let nearestD = 0;
  for (let d = minD; d <= maxD; d += roughStep) {
    const p = path.getPointAtLength(d);
    const distance = ((x - p.x) ** 2 + (y - p.y) ** 2) ** 0.5;
    if (distance < minDistance) {
      minDistance = distance;
      nearestD = d;
    }
  }
  // 細かく
  minDistance = Infinity;
  const searchFrom = Math.max(nearestD - roughStep / 2, minD);
  const searchTo = Math.min(nearestD + roughStep, maxD);
  const startP = path.getPointAtLength(searchFrom);
  nearestD = searchFrom;
  let nearestX = startP.x;
  let nearestY = startP.y;
  for (let d = searchFrom; d <= searchTo; d += 0.5) {
    const p = path.getPointAtLength(d);
    const distance = ((x - p.x) ** 2 + (y - p.y) ** 2) ** 0.5;
    if (distance < minDistance) {
      minDistance = distance;
      nearestX = p.x;
      nearestY = p.y;
      nearestD = d;
    }
  }

  return {
    x: nearestX,
    y: nearestY,
    distance: nearestD, // px
  };
};

const rgb = (hsv: HSV) => {
  return hsvToRgb(hsv.h, hsv.s, hsv.v);
};

type Mode = "view" | "draw" | "station" | "layer";

const initialRoute: Route = {
  name: "New Route",
  startDirection: null,
  points: [],
  stations: [],
  startLayer: 1,
  layerChangePoints: [],
  color: { h: 0, s: 100, v: 80 },
  width: 2,
};

export default function Rails() {
  const [routes, setRoutes] = useState([initialRoute]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const selectedRoute = routes[selectedRouteIdx] ?? null;
  const [hoveredAt, setHoveredAt] = useState<string | null>(null);
  const isHovered = (key: string) => key === hoveredAt;
  const [routeDeletionMode, setRouteDeletionMode] = useState(false);
  // route meta
  const [routeNameEditing, setRouteNameEditing] = useState<{ idx: number, name: string } | null>(null);
  const [routeColorEditing, setRouteColorEditing] = useState<{ idx: number, color: HSV } | null>(null);
  const routeNameBoxRef = useRef<HTMLInputElement | null>(null);
  // station
  const [stationLength, setStationLength] = useState(130); // m
  const [stationWidth, setStationWidth] = useState(16); // m
  // svg
  const [mode, setMode] = useState<Mode>("draw");
  const [mouseXY, setMouseXY] = useState<XY | null>(null); // in SVG
  const [dragStartedAt, setDragStartedAt] = useState<{ clicked: XY, topLeft: XY } | null>(null); // in SVG
  const [size, setSize] = useState<XY>({ x: 6000, y: 6000 }); // px
  const FRAME_WIDTH = 1080;
  const FRAME_HEIGHT = 720;
  const [zoom, setZoom] = useState(-2); // 2^x
  const [viewboxTL, setViewBoxTL] = useState<XY>({ x: 0, y: 0 });
  const routePathRefs = useRef<(SVGPathElement | null)[]>([]);
  const selectedPath = routePathRefs.current[selectedRouteIdx] ?? null;

  const getXYInSvg = (e: React.MouseEvent<SVGSVGElement>, topLeft?: XY) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - svgRect.x) / (2 ** zoom) + (topLeft || viewboxTL).x;
    const y = (e.clientY - svgRect.y) / (2 ** zoom) + (topLeft || viewboxTL).y;
    return { x, y };
  };

  const updateRoute = (idx: number, route: Route) => {
    const newRoutes = routes.map((r, i) => i == idx ? route : r);
    setRoutes(newRoutes);
  };

  const onClickSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = getXYInSvg(e);
    if (selectedRoute && mode == "view") {
      setDragStartedAt({ clicked: { x, y }, topLeft: { ...viewboxTL } });
    }
    if (selectedRoute && mode == "draw") {
      const newRoute = e.button == 2 ? calcPrevRoute(selectedRoute) : calcNextRoute(selectedRoute, meter(x), meter(y));
      updateRoute(selectedRouteIdx, newRoute);
    }
    if (selectedRoute && selectedPath && mode == "station") {
      const nearest = calcNearestPathPoint(selectedPath, x, y, px(stationLength));
      const newStation = {
        distance: nearest.distance,
        name: "New",
        number: "",
        nameLabelHidden: false,
        nameLabelPosition: { x: 32, y: 16 },
        numberLabelPosition: { x: 32, y: -16 },
        length: stationLength,
        width: stationWidth,
        left: 0,
        platform: "",
      };
      updateRoute(selectedRouteIdx, { ...selectedRoute, stations: [...selectedRoute.stations, newStation] });
    }
  };

  const onMouseMoveSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    const { x, y } = getXYInSvg(e, dragStartedAt?.topLeft);
    setMouseXY({ x, y });
    if (mode == "view" && dragStartedAt) {
      setViewBoxTL({
        x: dragStartedAt.topLeft.x - (x - dragStartedAt.clicked.x),
        y: dragStartedAt.topLeft.y - (y - dragStartedAt.clicked.y),
      });
    }
  };

  const onLeaveSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    setDragStartedAt(null);
  };

  const onWheelSvg = (e: React.WheelEvent<SVGSVGElement>) => {
    if (!mouseXY) return;
    e.stopPropagation();
    const newZoom = Math.max(Math.min(zoom - 0.002 * e.deltaY, 4), -5);
    const newLeft = mouseXY.x - (mouseXY.x - viewboxTL.x) / (2 ** (newZoom - zoom));
    const newTop = mouseXY.y - (mouseXY.y - viewboxTL.y) / (2 ** (newZoom - zoom));
    setZoom(newZoom);
    setViewBoxTL({ x: newLeft, y: newTop });
  };

  useEffect(() => {
    if (!routeNameBoxRef.current || !routeNameEditing) return;
    routeNameBoxRef.current.focus();
  }, [routeNameEditing]);

  const applyRouteName = () => {
    if (!routeNameEditing) return;
    updateRoute(routeNameEditing.idx, { ...routes[routeNameEditing.idx], name: routeNameEditing.name });
    setRouteNameEditing(null);
  };

  const applyRouteColor = () => {
    if (!routeColorEditing) return;
    updateRoute(routeColorEditing.idx, { ...routes[routeColorEditing.idx], color: routeColorEditing.color });
    setRouteColorEditing(null);
  };

  const addRoute = () => {
    setRoutes(prev => [...prev, { ...initialRoute }]);
    setRouteDeletionMode(false);
  };

  const deleteRoute = (idx: number) => {
    if (!routeDeletionMode || routes.length == 1) return;
    setRoutes(prev => prev.filter((_, i) => i !== idx));
    if (selectedRouteIdx >= idx) {
      setSelectedRouteIdx(prev => prev - 1);
    }
  };

  const previewRoute = selectedRoute && mouseXY && mode == "draw" ? calcNextRoute(selectedRoute, meter(mouseXY.x), meter(mouseXY.y), 2000) : null;
  const previewPoint = selectedPath && mouseXY && mode == "station" ? calcNearestPathPoint(selectedPath, mouseXY.x, mouseXY.y, px(stationLength)) : null;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginTop: 80 }}>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 240, borderTop: "solid 1px #aab" }}>
        {/* routes menu */}
        <div style={{ display: "flex", alignItems: "center", borderBottom: "solid 1px #aab" }}>
          {[
            { onClick: addRoute, OpeIcon: Add },
            { onClick: () => setRouteDeletionMode(prev => !prev), OpeIcon: Delete, bgColor: routeDeletionMode ? "#fcc" : null }
          ].map((o, i) => {
            const key = `routeOperation_${i}`;
            return (
              <div
                key={key}
                style={{
                  borderRight: "solid 1px #ccd",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  color: "#666",
                  backgroundColor: o.bgColor || (isHovered(key) ? "#eef8ff" : "transparent"),
                  cursor: "pointer",
                }}
                onClick={o.onClick}
                onMouseEnter={() => setHoveredAt(key)}
                onMouseLeave={() => setHoveredAt(null)}
              >
                <o.OpeIcon style={{ fontSize: 16 }} />
              </div>
            );
          })}
        </div>
        {/* routes list */}
        {routes.map((route, i) => {
          const key = `routeSelect_${i}`;
          return (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "solid 1px #ccc",
                backgroundColor: i == selectedRouteIdx ? "#ddf4ff" : isHovered(key) ? "#eef8ff" : "transparent",
                padding: "8px",
              }}
              onClick={() => setSelectedRouteIdx(i)}
              onMouseEnter={() => setHoveredAt(key)}
              onMouseLeave={() => setHoveredAt(null)}
            >
              <div
                style={{ position: "relative", width: 24, height: 24, backgroundColor: rgb(route.color), borderRadius: "50%", cursor: "pointer" }}
                onClick={() => setRouteColorEditing({ idx: i, color: { ...route.color } })}
              >
                {routeColorEditing && routeColorEditing.idx == i && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, boxShadow: "2px 2px 4px #aaa", zIndex: 10 }} onClick={e => e.stopPropagation()}>
                    <ColorPicker
                      color={routeColorEditing.color}
                      onChange={v => setRouteColorEditing({ idx: i, color: v })}
                      onApply={applyRouteColor}
                      onClose={() => setRouteColorEditing(null)}
                    />
                  </div>
                )}
              </div>
              
              {!routeDeletionMode && routeNameEditing && routeNameEditing?.idx == i ? (
                <>
                  <input
                    ref={routeNameBoxRef}
                    type="text"
                    style={{
                      width: 120,
                      height: 20,
                      outline: "none",
                      border: "solid 1px #aab",
                      borderRadius: 4,
                    }}
                    value={routeNameEditing.name}
                    onChange={(e) => setRouteNameEditing({ idx: i, name: e.target.value })}
                    onKeyDown={(e) => { if (e.key == "Enter") { applyRouteName(); } if (e.key == "Escape") { setRouteNameEditing(null); } }}
                  />
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8, color: "#48f" }}>
                    <Close fontSize="medium" style={{ cursor: "pointer" }} onClick={() => setRouteNameEditing(null)} />
                    <Check fontSize="medium" style={{ cursor: "pointer" }} onClick={applyRouteName} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 14 }}>{route.name}</div>
                  {routeDeletionMode ? (
                    <div
                      style={{ marginLeft: "auto", display: "flex", alignItems: "center", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); deleteRoute(i); }}
                    >
                      <Delete fontSize="small" style={{ color: routes.length > 1 ? "#f44" : "#eaa" }} />
                    </div>
                  ) : (
                    <div
                      style={{ marginLeft: "auto", display: "flex", alignItems: "center", cursor: "pointer" }}
                      onClick={() => setRouteNameEditing({ idx: i, name: route.name })}
                    >
                      <ModeEdit fontSize="small" style={{ color: "#666" }} />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", border: "solid 1px #aab" }}>
        {/* mode */}
        <div style={{ display: "flex", alignItems: "center", borderBottom: "solid 1px #aab" }}>
          {[
            { mode: "view", ModeIcon: PanTool },
            { mode: "draw", ModeIcon: ModeEdit },
            { mode: "station", ModeIcon: Place },
          ].map(m => {
            const key = `modeSelect_${m.mode}`;
            return (
              <div
                key={key}
                style={{
                  borderRight: "solid 1px #ccd",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                  color: "#666",
                  backgroundColor: mode == m.mode ? "#ddf4ff" : isHovered(key) ? "#eef8ff" : "transparent",
                  cursor: "pointer",
                }}
                onClick={() => setMode(m.mode as Mode)}
                onMouseEnter={() => setHoveredAt(key)}
                onMouseLeave={() => setHoveredAt(null)}
              >
                <m.ModeIcon style={{ fontSize: 16 }} />
              </div>
            );
          })}
        </div>
        {/* svg */}
        <div onContextMenu={e => e.preventDefault()}>
          <svg
            width={FRAME_WIDTH}
            height={FRAME_HEIGHT}
            viewBox={`${viewboxTL.x} ${viewboxTL.y} ${FRAME_WIDTH / (2 ** zoom)} ${FRAME_HEIGHT / (2 ** zoom)}`}
            onMouseDown={onClickSvg}
            onMouseMove={onMouseMoveSvg}
            onMouseUp={onLeaveSvg}
            onMouseLeave={onLeaveSvg}
            onWheel={onWheelSvg}
            style={{ 
              backgroundColor: "#444",
              cursor: mode == "view" ? (dragStartedAt ? "grabbing" : "grab") :
                mode == "draw" ? "crosshair" :
                mode == "station" ? "pointer" : "default",
            }}
          >
            <rect x={0} y={0} width={size.x} height={size.y} fill="#fff" />

            {/* grid */}
            {Array.from({ length: Math.floor(meter(size.x) / 1000) }).map((_, i) => {
              const x = px(1000 * (i + 1));
              return <path key={`grid_xl_${i}`} d={`M${x} 0 ${x} ${size.y}`} stroke="#ccc" strokeWidth={1} fill="none" />;
            })}
            {zoom > -2 && Array.from({ length: Math.floor(meter(size.x) / 100) }).map((_, i) => {
              const x = px(100 * (i + 1));
              return <path key={`grid_yl_${i}`} d={`M${x} 0 ${x} ${size.y}`} stroke="#ddd" strokeWidth={0.5} fill="none" />;
            })}
            {Array.from({ length: Math.floor(meter(size.y) / 1000) }).map((_, i) => {
              const y = px(1000 * (i + 1));
              return <path key={`grid_xs_${i}`} d={`M0 ${y} ${size.x} ${y}`} stroke="#ccc" strokeWidth={1} fill="none" />;
            })}
            {zoom > -2 && Array.from({ length: Math.floor(meter(size.y) / 100) }).map((_, i) => {
              const y = px(100 * (i + 1));
              return <path key={`grid_ys_${i}`} d={`M0 ${y} ${size.x} ${y}`} stroke="#ddd" strokeWidth={0.5} fill="none" />;
            })}

            {/* draw preview */}
            {mode == "draw" && mouseXY && selectedRoute.points.length == 0 && (
              <circle cx={mouseXY.x} cy={mouseXY.y} r={8} fill={rgb(selectedRoute.color)} />
            )}
            {mode == "draw" && previewRoute && previewRoute.startDirection !== null && (
              <path
                d={calcPath(previewRoute.startDirection, previewRoute.points).svgPath}
                stroke="#888"
                strokeWidth={1}
                fill="none"
              />
            )}

            {/* routes */}
            {routes.map((route, i) => route.startDirection !== null && (
              <RoutePath
                key={`routePath_${i}`}
                ref={elm => { routePathRefs.current[i] = elm; }}
                startDirection={route.startDirection}
                points={route.points}
                color={route.color}
                width={route.width}
              />
            ))}

            {/* station preview */}
            {mode == "station" && selectedRoute && selectedPath && previewPoint && (
              <path
                d={`M${Array.from({ length: 15 }).map((_, i) => {
                  const p = selectedPath.getPointAtLength(previewPoint.distance + px(stationLength) * (i - 7) / (7 * 2));
                  return `${p.x} ${p.y}`;
                }).join("L")}`}
                stroke={rgb(selectedRoute.color)}
                strokeWidth={px(stationWidth)}
                strokeOpacity={0.4}
                fill="none"
              />
            )}

            {/* stations */}
            {routes.map((route, i) => route.stations.map((station, j) => {
              const key = `station_${i}_${j}`;
              const path = routePathRefs.current[i];
              return path && (
                <StationPath
                  key={key}
                  id={key}
                  path={path}
                  distance={station.distance}
                  length={station.length}
                  color={route.color}
                  width={station.width}
                />
              );
            }))}
          </svg>
        </div>
      </div>
    </div>
  );
};

const ColorPicker = ({
  color,
  onChange,
  onApply,
  onClose,
}: {
  color: HSV;
  onChange: (v: HSV) => void;
  onApply: (v: HSV) => void;
  onClose: () => void;
}) => {
  const [dragging, setDragging] = useState<"h" | "s" | "v" | null>(null);
  const hBarRef = useRef<HTMLDivElement | null>(null);
  const sBarRef = useRef<HTMLDivElement | null>(null);
  const vBarRef = useRef<HTMLDivElement | null>(null);
  const onClickBar = (e: React.MouseEvent<HTMLDivElement>, param: "h" | "s" | "v") => {
    const barElm = param == "h" ? hBarRef.current : param == "s" ? sBarRef.current : vBarRef.current;
    if (!barElm) return;
    const barRect = barElm.getBoundingClientRect();
    const value = (param == "h" ? 360 : 100) * Math.min(Math.max((e.clientX - barRect.x) / barRect.width, 0), 1);
    onChange({ ...color, [param]: Math.round(value) });
  };

  const barCssParams: React.CSSProperties = {
    width: 360,
    height: 16,
    position: "relative",
    userSelect: "none",
    cursor: "pointer",
  };

  const cursorCssParams: React.CSSProperties = {
    position: "absolute",
    top: -4,
    width: 4,
    height: 24,
    backgroundColor: "#fff",
    border: "1px solid #ccd",
    userSelect: "none",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: 400,
        backgroundColor: "#fff",
        padding: "16px 24px",
        border: "1px solid #ccd",
        borderRadius: 8,
        cursor: "default",
      }}
      onMouseMove={(e) => { if (dragging) onClickBar(e, dragging); }}
      onMouseUp={() => setDragging(null)}
      onMouseLeave={() => setDragging(null)}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ height: 32, backgroundColor: rgb(color) }} />
        <div style={{ fontSize: 12, color: "#888" }}>{rgb(color)}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div
          ref={hBarRef}
          style={{
            ...barCssParams,
            background: `linear-gradient(90deg, ${Array.from({ length: 12 }).map((_, i) => rgb({ ...color, h: i * 360 / 12 })).join(", ")})`,
          }}
          onClick={(e) => onClickBar(e, "h")}
          onMouseDown={() => setDragging("h")}
        >
          <div
            style={{
              ...cursorCssParams,
              left: `calc(${color.h * 100 / 360}% - 2px)`,
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: "#888" }}>{color.h}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div
          ref={sBarRef}
          style={{
            ...barCssParams,
            background: `linear-gradient(90deg, ${Array.from({ length: 12 }).map((_, i) => rgb({ ...color, s: i * 100 / 12 })).join(", ")})`,
          }}
          onClick={(e) => onClickBar(e, "s")}
          onMouseDown={() => setDragging("s")}
        >
          <div
            style={{
              ...cursorCssParams,
              left: `calc(${color.s}% - 2px)`,
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: "#888" }}>{color.s}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div
          ref={vBarRef}
          style={{
            ...barCssParams,
            background: `linear-gradient(90deg, ${Array.from({ length: 12 }).map((_, i) => rgb({ ...color, v: i * 100 / 12 })).join(", ")})`,
          }}
          onClick={(e) => onClickBar(e, "v")}
          onMouseDown={() => setDragging("v")}
        >
          <div
            style={{
              ...cursorCssParams,
              left: `calc(${color.v}% - 2px)`,
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: "#888" }}>{color.v}</div>
      </div>
      <div style={{ display: "flex", gap: 16, color: "#48f" }}>
        <Close fontSize="medium" style={{ cursor: "pointer" }} onClick={onClose} />
        <Check fontSize="medium" style={{ cursor: "pointer" }} onClick={() => onApply(color)} />
      </div>
    </div>
  );
};

type RoutePathProps = {
  ref: React.Ref<SVGPathElement>;
  startDirection: number;
  points: RoutePoint[];
  color: HSV;
  width: number
};

const RoutePath = React.memo((props: RoutePathProps) => (
  <path
    ref={props.ref}
    d={calcPath(props.startDirection, props.points).svgPath}
    stroke={rgb(props.color)}
    strokeWidth={props.width}
    fill="none"
  />
), (prev, next) => {
  for (const key of Object.keys(prev) as (keyof RoutePathProps)[]) {
    if (key === "points" || key === "color") continue;
    if (!Object.is(prev[key], next[key])) {
      return false;
    }
  }
  return (
    prev.points.length == next.points.length && prev.points.every((prevP, i) => (
      Object.keys(prevP) as (keyof RoutePoint)[]).every((key) => Object.is(prevP[key], next.points[i][key])
    )) &&
    (Object.keys(prev.color) as (keyof HSV)[]).every((key) => Object.is(prev.color[key], next.color[key]))
  );
});

type StationPathProps = {
  id: string;
  path: SVGPathElement;
  distance: number;
  length: number;
  color: HSV;
  width: number;
};

const StationPath = React.memo((props: StationPathProps) => (
  <path
    d={`M${Array.from({ length: 15 }).map((_, i) => {
      const p = props.path.getPointAtLength(props.distance + px(props.length) * (i - 7) / (7 * 2));
      return `${p.x} ${p.y}`;
    }).join("L")}`}
    stroke={rgb(props.color)}
    strokeWidth={px(props.width)}
    fill="none"
  />
), (prev, next) => {
  for (const key of Object.keys(prev) as (keyof StationPathProps)[]) {
    if (key === "color") continue;
    if (!Object.is(prev[key], next[key])) {
      return false;
    }
  }
  return (
    (Object.keys(prev.color) as (keyof HSV)[]).every((key) => Object.is(prev.color[key], next.color[key]))
  );
});