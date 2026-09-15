import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Add,
  AddLocationAlt,
  Check,
  Close,
  Delete,
  EditLocationAlt,
  FileDownload,
  FileOpen,
  Layers,
  ModeEdit,
  PanTool,
  Save,
} from "@mui/icons-material";
import { z } from "zod";
import { hsvToRgb } from "@/chord/model";

const XYSchema = z.object({
  x: z.number(),
  y: z.number(),
});
type XY = z.infer<typeof XYSchema>;

const RoutePointSchema = XYSchema.extend({
  length: z.number().nullable(), // 点(x,y) -> 直線(length) -> 次の点に向かう曲線(円弧) -> ...
});
type RoutePoint = z.infer<typeof RoutePointSchema>;

const StationSchema = z.object({
  distance: z.number(), // px
  name: z.string(),
  number: z.string(),
  nameLabelPosition: XYSchema, // 相対px
  numberLabelPosition: XYSchema, // 相対px
  length: z.number(), // m
  width: z.number(), // m
  left: z.number(), // 中心からのずれ(進行左方向) m
  platform: z.string(), // 進行左からホーム有無 ex: 101(相対) 010(島) 1010
});
type Station = z.infer<typeof StationSchema>;

const LayerChangePointSchema = z.object({
  distance: z.number(),
  upper: z.boolean(),
});
type LayerChangePoint = z.infer<typeof LayerChangePointSchema>;

const HSVSchema = z.object({
  h: z.number(),
  s: z.number(),
  v: z.number(),
});
type HSV = z.infer<typeof HSVSchema>;

// 元データ(長さ系の単位は基本m)
const RouteSchema = z.object({
  name: z.string(),
  startDirection: z.number().nullable(), // rad
  points: z.array(RoutePointSchema),
  stations: z.array(StationSchema),
  startLayer: z.number(), // 0-2 (地下～高架)
  layerChangePoints: z.array(LayerChangePointSchema),
  color: HSVSchema,
  width: z.number(), // px
});
type Route = z.infer<typeof RouteSchema>;

const SaveDataSchema = z.object({
  routes: z.array(RouteSchema),
  size: XYSchema,
  offset: XYSchema,
  stationLength: z.number(),
  stationWidth: z.number(),
  bgImage: z.string().nullable(),
});
type SaveData = z.infer<typeof SaveDataSchema>;

const METER_PER_PX = 5;
const meter = (px: number) => px * METER_PER_PX;
const px = (meter: number) => meter / METER_PER_PX;

const cursorDelete = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M5 5L19 19M19 5L5 19' stroke='black' stroke-width='2'/%3E%3C/svg%3E") 12 12, auto`;

type RoutePointInfo = RoutePoint & {
  midX: number | null;
  midY: number | null;
};

type PathData = {
  svgPath: string;
  lastDirection: number,
  lastRadius: number | null,
  pointsInfo: RoutePointInfo[];
};

const calcPath = (startDirection: number, points: RoutePoint[], offset: XY, from: number = 0, to: number = Infinity): PathData => {
  const svgParts: string[] = [];
  let direction = startDirection;
  let lastRadius;
  let distance = 0;
  let nextDistance = 0;
  const pointsInfo: RoutePointInfo[] = points.map(p => ({ ...p, midX: null, midY: null }));
  for (const [i, point] of points.entries()) {
    if (i == 0 && from <= 0) {
      svgParts.push(`M${px(point.x) + offset.x} ${px(point.y) + offset.y}`);
    }
    // 点 -> 直線
    const midX = point.x + (point.length ?? 0) * Math.cos(direction);
    const midY = point.y + (point.length ?? 0) * Math.sin(direction);
    nextDistance = distance + (point.length ?? 0);
    if (to < distance || nextDistance < from) {
      // none
    } else if (from <= distance && nextDistance <= to) {
      svgParts.push(`L${px(midX) + offset.x} ${px(midY) + offset.y}`);
    } else {
      const fromX = point.x + (from - distance) * Math.cos(direction);
      const fromY = point.y + (from - distance) * Math.sin(direction);
      const toX = point.x + (to - distance) * Math.cos(direction);
      const toY = point.y + (to - distance) * Math.sin(direction);
      if (distance < from && from < nextDistance) {
        svgParts.push(`M${px(fromX) + offset.x} ${px(fromY) + offset.y}`);
      }
      if (distance < to && to < nextDistance) {
        svgParts.push(`L${px(toX) + offset.x} ${px(toY) + offset.y}`);
      } else {
        svgParts.push(`L${px(midX) + offset.x} ${px(midY) + offset.y}`);
      }
    }
    distance = nextDistance;
    pointsInfo[i].midX = midX;
    pointsInfo[i].midY = midY;
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
      const lineLength = (vx ** 2 + vy ** 2) ** 0.5;
      nextDistance = distance + lineLength;
      if (to < distance || nextDistance < from) {
        // none
      } else if (from <= distance && nextDistance <= to) {
        svgParts.push(`L${px(nextX) + offset.x} ${px(nextY) + offset.y}`);
      } else {
        const fromX = midX + (from - distance) * Math.cos(direction);
        const fromY = midY + (from - distance) * Math.sin(direction);
        const toX = midX + (to - distance) * Math.cos(direction);
        const toY = midY + (to - distance) * Math.sin(direction);
        if (distance < from && from < nextDistance) {
          svgParts.push(`M${px(fromX) + offset.x} ${px(fromY) + offset.y}`);
        }
        if (distance < to && to < nextDistance) {
          svgParts.push(`L${px(toX) + offset.x} ${px(toY) + offset.y}`);
        } else {
          svgParts.push(`L${px(nextX) + offset.x} ${px(nextY) + offset.y}`);
        }
      }
      distance = nextDistance;
      continue;
    }
    const r = (vx ** 2 + vy ** 2) / (2 * dot);
    const cx = midX + r * nx; // 中心
    const cy = midY + r * ny;
    const startAngle = Math.atan2(midY - cy, midX - cx);
    const _endAngle = Math.atan2(nextY - cy, nextX - cx);
    const endAngle = r > 0 ? _endAngle + (_endAngle < startAngle ? Math.PI * 2 : 0) : _endAngle - (_endAngle > startAngle ? Math.PI * 2 : 0)
    const isLargeArc = Math.abs(endAngle - startAngle) > Math.PI;
    const isClockwise = r > 0; // SVG上
    const arcLength = Math.abs((endAngle - startAngle) * r);
    nextDistance = distance + arcLength;
    if (to < distance || nextDistance < from) {
      // none
    } else if (from <= distance && nextDistance <= to) {
      svgParts.push(`A${px(r)} ${px(r)} 0 ${isLargeArc ? "1" : "0"} ${isClockwise ? "1" : "0"} ${px(nextX) + offset.x} ${px(nextY) + offset.y}`);
    } else {
      const fromAngle = startAngle + (endAngle - startAngle) * (from - distance) / arcLength;
      const fromX = cx + Math.abs(r) * Math.cos(fromAngle);
      const fromY = cy + Math.abs(r) * Math.sin(fromAngle);
      const toAngle = startAngle + (endAngle - startAngle) * (to - distance) / arcLength;
      const toX = cx + Math.abs(r) * Math.cos(toAngle);
      const toY = cy + Math.abs(r) * Math.sin(toAngle);
      const useFrom = distance < from && from < nextDistance;
      const useTo = distance < to && to < nextDistance;
      if (useFrom) {
        svgParts.push(`M${px(fromX) + offset.x} ${px(fromY) + offset.y}`);
      }
      const endX = useTo ? toX : nextX;
      const endY = useTo ? toY : nextY;
      const arcSize = Math.abs((useTo ? toAngle : endAngle) - (useFrom ? fromAngle : startAngle));
      svgParts.push(`A${px(r)} ${px(r)} 0 ${arcSize > Math.PI ? "1" : "0"} ${isClockwise ? "1" : "0"} ${px(endX) + offset.x} ${px(endY) + offset.y}`);
    }
    distance = nextDistance;
    direction = r > 0 ? Math.atan2(nextX - cx, -(nextY - cy)) : Math.atan2(-(nextX - cx), nextY - cy);
    lastRadius = r;
  };
  return {
    svgPath: svgParts.join(""),
    lastDirection: direction,
    lastRadius: lastRadius ?? null,
    pointsInfo,
  };
};

const calcNextRoute = (r: Route, x: number, y: number, offset: XY, addLength?: number) => {
  const route = { ...r, points: r.points.map(p => ({ ...p })) };
  const lastPoint = route.points[route.points.length - 1];
  if (!lastPoint || lastPoint.length !== null) { // 次の点
    route.points.push({ x: x - meter(offset.x), y: y - meter(offset.y), length: addLength ?? null });
  } else { // 直線長さ
    const direction = route.startDirection !== null ? calcPath(route.startDirection, route.points, offset).lastDirection : null;
    const vx = x - meter(offset.x) - lastPoint.x;
    const vy = y - meter(offset.y) - lastPoint.y;
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
  const roughStep = 100;
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
  for (let d = searchFrom; d <= searchTo; d += 1) {
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

const getDirectionAtLength = (path: SVGPathElement, d: number) => {
  const total = path.getTotalLength();
  const d1 = d >= total ? total - 0.01 : Math.max(d, 0);
  const d2 = d >= total ? total : d1 + 0.01;
  const p1 = path.getPointAtLength(d1);
  const p2 = path.getPointAtLength(d2);
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

const getSidePoint = (x: number, y: number, direction: number, distance: number) => {
  const dx = Math.cos(direction + Math.PI / 2) * distance;
  const dy = Math.sin(direction + Math.PI / 2) * distance;
  return { x: x + dx, y: y + dy, direction };
};

const rgb = (hsv: HSV) => {
  return hsvToRgb(hsv.h, hsv.s, hsv.v);
};

const lighten = (color: HSV, rate: number): HSV => {
  // -Inf black - 0 original - Inf white
  const s = color.s / 2 ** Math.abs(rate);
  const v = rate > 0 ? 100 - (100 - color.v) / 2 ** rate : color.v * 2 ** rate;
  return { ...color, s, v };
};

type Mode = "view" | "draw" | "station" | "station_edit" | "layer";

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

const inputStyle: React.CSSProperties = {
  height: 20,
  outline: "none",
  border: "solid 1px #aab",
  borderRadius: 4,
};

const moveButtonStyle: React.CSSProperties = {
  width: 32,
  height: 24,
  lineHeight: 1,
  textAlign: "center",
  cursor: "pointer",
};

export default function Rails() {
  const [routes, setRoutes] = useState([initialRoute]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const selectedRoute = routes[selectedRouteIdx] ?? null;
  const [hoveredAt, setHoveredAt] = useState<string | null>(null);
  const isHovered = (key: string) => key === hoveredAt;
  const [routeDeletionMode, setRouteDeletionMode] = useState(false);
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [saved, setSaved] = useState(false);
  const [autoSave, setAutoSave] = useState(false);
  const [fileReadFailed, setFileReadFailed] = useState(false);
  const fileOpened = useRef(false);
  // route meta
  const [routeNameEditing, setRouteNameEditing] = useState<{ idx: number, name: string } | null>(null);
  const [routeColorEditing, setRouteColorEditing] = useState<{ idx: number, color: HSV } | null>(null);
  const routeNameBoxRef = useRef<HTMLInputElement | null>(null);
  // station
  const [stationLength, setStationLength] = useState(130); // m
  const [stationWidth, setStationWidth] = useState(16); // m
  const [selectedStationIdx, setSelectedStationIdx] = useState<({ routeIdx: number, stationIdx: number } | null)>(null);
  const selectedStation = selectedStationIdx !== null ? routes[selectedStationIdx.routeIdx]?.stations[selectedStationIdx.stationIdx] ?? null : null;
  // layer
  const [upper, setUpper] = useState(false);
  // svg
  const [mode, setMode] = useState<Mode>("draw");
  const [mouseXY, setMouseXY] = useState<XY | null>(null); // in SVG
  const [dragStartedAt, setDragStartedAt] = useState<{ clicked: XY, topLeft: XY } | null>(null); // in SVG
  const [size, setSize] = useState<XY>({ x: 6000, y: 6000 }); // px
  const [offset, setOffset] = useState<XY>({ x: 0, y: 0 }) // px
  const FRAME_WIDTH = 1080;
  const FRAME_HEIGHT = 720;
  const [zoom, setZoom] = useState(-2); // 2^x
  const [viewboxTL, setViewBoxTL] = useState<XY>({ x: 0, y: 0 });
  const routePathRefs = useRef<(SVGPathElement | null)[]>([]);
  const selectedPath = routePathRefs.current[selectedRouteIdx] ?? null;
  const routePathLengths = routePathRefs.current.map(path => path?.getTotalLength() || null);
  const routePathData = routes.map(r => r.startDirection !== null ? calcPath(r.startDirection, r.points, offset) : null);
  const selectedPathData = routePathData[selectedRouteIdx] ?? null;
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const setPathRef = useCallback((elm: SVGPathElement | null, i: number) => {
    routePathRefs.current[i] = elm;
  }, []);

  const save = async () => {
    setFileReadFailed(false);
    let handle = fileHandle;
    if (!handle) {
      handle = await window.showSaveFilePicker({
        suggestedName: "rails.json",
        types: [
          {
            description: "JSON",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });
      setFileHandle(handle);
    };
    
    const writable = await handle.createWritable();
    const data: SaveData = {
      routes,
      size,
      offset,
      stationLength,
      stationWidth,
      bgImage,
    };
    await writable.write(JSON.stringify(data));
    await writable.close();
    setSaved(true);
  };

  const openFile = async () => {
    if (!("showOpenFilePicker" in window)) return;
    setFileReadFailed(false);
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "JSON",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });
      const file = await handle.getFile();
      const text = await file.text();
      const json = JSON.parse(text);
      const result = SaveDataSchema.safeParse(json);
      if (!result.success) {
        console.error(result.error.issues);
        setFileReadFailed(true);
        return;
      }
      const routes = result.data.routes;
      setRoutes(routes.length == 0 ? [initialRoute] : routes);
      setSize(result.data.size);
      setOffset(result.data.offset);
      setStationLength(result.data.stationLength);
      setStationWidth(result.data.stationWidth);
      setBgImage(result.data.bgImage);
      setSelectedRouteIdx(0);
      setFileHandle(handle);
      setSaved(true);
      fileOpened.current = true;
    } catch (e) {
      console.error(e);
      setFileReadFailed(true);
    }
  };

  useEffect(() => {
    if (fileOpened.current) {
      fileOpened.current = false;
      return;
    }
    setSaved(false);
    if (autoSave && fileHandle) {
      save();
    }
  }, [routes, size, offset, stationLength, stationWidth, bgImage]);

  useEffect(() => {
    if (autoSave && !saved) {
      save();
    }
  }, [autoSave]);

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
      const newRoute = e.button == 2 ? calcPrevRoute(selectedRoute) : calcNextRoute(selectedRoute, meter(x), meter(y), offset);
      updateRoute(selectedRouteIdx, newRoute);
    }
    if (selectedRoute && selectedPath && mode == "station") {
      const nearest = calcNearestPathPoint(selectedPath, x, y, px(stationLength));
      const newStation: Station = {
        distance: nearest.distance,
        name: "",
        number: "",
        nameLabelPosition: { x: -22, y: -4 },
        numberLabelPosition: { x: 8, y: -8 },
        length: stationLength,
        width: stationWidth,
        left: 0,
        platform: "",
      };
      updateRoute(selectedRouteIdx, { ...selectedRoute, stations: [...selectedRoute.stations, newStation] });
    }
    if (selectedRoute && selectedPath && mode == "layer") {
      if (hoveredAt && hoveredAt.startsWith("layerChange_")) return;
      const nearest = calcNearestPathPoint(selectedPath, x, y);
      const currentLayer = getLayerAtLength(selectedRoute.startLayer, selectedRoute.layerChangePoints, nearest.distance);
      const nextLayer = currentLayer + (upper ? 1 : -1);
      if (nextLayer < 0 || 2 < nextLayer) return;
      const newLayerPoint: LayerChangePoint = {
        distance: nearest.distance,
        upper,
      };
      updateRoute(selectedRouteIdx, { ...selectedRoute, layerChangePoints: [...selectedRoute.layerChangePoints, newLayerPoint] });
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
    setSelectedRouteIdx(routes.length);
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

  const onClickStation = useCallback((e: React.MouseEvent<SVGPathElement>, routeIdx: number, stationIdx: number) => {
    if (mode != "station_edit") return;
    setSelectedStationIdx({ routeIdx, stationIdx });
  }, [mode]);

  const updateStation = (routeIdx: number, stationIdx: number, value: Partial<Station>) => {
    const route = routes[routeIdx];
    const station = route?.stations[stationIdx];
    if (mode != "station_edit" || !station) return;
    const newStations = route.stations.map((s, i) => i == stationIdx ? { ...station, ...value } : s);
    updateRoute(routeIdx, { ...route, stations: newStations });
  };

  const moveStationLabel = (routeIdx: number, stationIdx: number, type: "name" | "number", diff: XY) => {
    const route = routes[routeIdx];
    const station = route?.stations[stationIdx];
    if (mode != "station_edit" || !station) return;
    const prevPosition = type == "name" ? station.nameLabelPosition : station.numberLabelPosition;
    const newPosition = { x: prevPosition.x + diff.x, y: prevPosition.y + diff.y };
    const key: keyof Station = type == "name" ? "nameLabelPosition" : "numberLabelPosition"; 
    updateStation(routeIdx, stationIdx, { [key]: newPosition });
  };

  const deleteStation = (routeIdx: number, stationIdx: number) => {
    const route = routes[routeIdx];
    if (mode != "station_edit" || !route) return;
    const newStations = route.stations.filter((_, i) => i !== stationIdx);
    updateRoute(routeIdx, { ...route, stations: newStations });
    setSelectedStationIdx(null);
  };

  const getLayerAtLength = (startLayer: number, changePoints: LayerChangePoint[], distance: number) => {
    return changePoints.filter(p => p.distance <= distance).reduce((acc, p) => acc + (p.upper ? 1 : -1), startLayer);
  };

  const onClickLayerChange = useCallback((e: React.MouseEvent<SVGPathElement>, routeIdx: number, pointIdx: number) => {
    const route = routes[routeIdx];
    if (mode != "layer" || !route) return;
    const newPoints = route.layerChangePoints.filter((_, i) => i !== pointIdx);
    updateRoute(routeIdx, { ...route, layerChangePoints: newPoints });
    setHoveredAt(null);
  }, [mode, routes]);

  const reverseRoute = (routeIdx: number) => {
    const route = routes[routeIdx];
    const pathData = routePathData[routeIdx];
    const pathElm = routePathRefs.current[routeIdx];
    if (mode != "draw" || !route || !pathData || !pathElm || route.points.length == 0 || route.startDirection === null) return;
    const totalLength = pathElm.getTotalLength();
    const startDirection = pathData.lastDirection + Math.PI;
    const points = [...pathData.pointsInfo].reverse().map((p, i, pts) => {
      const x = pts[i].midX ?? pts[i].x;
      const y = pts[i].midY ?? pts[i].y;
      const length = p.length ?? 0;
      return { x, y, length };
    });
    const stations = route.stations.map(s => ({ ...s, distance: totalLength - s.distance }));
    const layerChangePoints = route.layerChangePoints.map(s => ({ ...s, distance: totalLength - s.distance, upper: !s.upper }));
    const startLayer = getLayerAtLength(route.startLayer, route.layerChangePoints, totalLength);
    updateRoute(routeIdx, { ...route, startDirection, points, stations, layerChangePoints, startLayer });
  };

  const autofillStationNumber = (routeIdx: number, stationIdx: number, prev = true) => {
    const route = routes[routeIdx];
    const station = route?.stations[stationIdx];
    if (!route || !station) return;
    const prevStation = prev ? route.stations.filter(s => s.distance < station.distance).sort((a, b) => b.distance - a.distance)[0] :
      route.stations.filter(s => s.distance > station.distance).sort((a, b) => a.distance - b.distance)[0];
    if (!prevStation || !prevStation.number) return;
    const newNumber = prevStation.number.replace(/(\d+)$/, (_, num) => `${Number(num) + 1}`.padStart(num.length, "0"));
    updateStation(routeIdx, stationIdx, { number: newNumber });
  };

  const handleBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBgImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toPng = () => {
    const svg = document.querySelector("#main-svg") as SVGSVGElement;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(size.x));
    clone.setAttribute("height", String(size.y));
    clone.setAttribute("viewBox", `0 0 ${size.x} ${size.y}`);
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size.x;
      canvas.height = size.y;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = fileHandle ? fileHandle.name.replace(/\.json$/, "") + ".png" : "rails.png";
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    img.src = url;
  };

  const previewRoute = selectedRoute && mouseXY && mode == "draw" ? calcNextRoute(selectedRoute, meter(mouseXY.x), meter(mouseXY.y), offset, 2000) : null;
  const previewPath = previewRoute && previewRoute.startDirection !== null ? calcPath(previewRoute.startDirection, previewRoute.points, offset) : null;
  const previewPoint = selectedPath && mouseXY && (mode == "station" || mode == "layer") ? calcNearestPathPoint(selectedPath, mouseXY.x, mouseXY.y, mode == "station" ? px(stationLength) : 0) : null;

  const distanceFromPrevStation = (distance: number, stations: Station[]) => {
    const prevStation = stations.filter(s => s.distance < distance).sort((a, b) => b.distance - a.distance)[0];
    return prevStation ? distance - prevStation.distance : null;
  };
  const distanceToNextStation = (distance: number, stations: Station[]) => {
    const nextStation = stations.filter(s => s.distance > distance).sort((a, b) => a.distance - b.distance)[0];
    return nextStation ? nextStation.distance - distance : null;
  };
  const previewFromPrev = previewPoint && selectedRoute ? distanceFromPrevStation(previewPoint.distance, selectedRoute.stations) : null;
  const previewToNext = previewPoint && selectedRoute ? distanceToNextStation(previewPoint.distance, selectedRoute.stations) : null;
  const selectedFromPrev = selectedStationIdx && selectedStation && routes[selectedStationIdx.routeIdx] ? distanceFromPrevStation(selectedStation.distance, routes[selectedStationIdx.routeIdx].stations) : null;
  const selectedToNext = selectedStationIdx && selectedStation && routes[selectedStationIdx.routeIdx] ? distanceToNextStation(selectedStation.distance, routes[selectedStationIdx.routeIdx].stations) : null;

  const sortedLayerChangePoints = routes.map(r => r.layerChangePoints.sort((a, b) => a.distance - b.distance).reduce((acc, p, i) => {
    const fromLayer = Math.min(Math.max(i == 0 ? r.startLayer : (acc[i - 1].fromLayer + (acc[i - 1].upper ? 1 : -1)), 0), 2);
    acc.push({ ...p, fromLayer });
    return acc;
  }, [] as (LayerChangePoint & { fromLayer: number })[]));
  const layerRanges = routes.map(r => {
    const ranges = r.layerChangePoints.sort((a, b) => a.distance - b.distance).reduce((acc, p, i, pts) => {
      const from = i == 0 ? 0 : acc[i - 1].to;
      const to = p.distance;
      const layer = Math.min(Math.max(i == 0 ? r.startLayer : (acc[i - 1].layer + (pts[i - 1].upper ? 1 : -1)), 0), 2);
      acc.push({ from, to, layer });
      return acc;
    }, [] as ({ from: number, to: number, layer: number })[]);
    ranges.push({
      from: ranges.length == 0 ? 0 : ranges[ranges.length - 1].to,
      to: Infinity,
      layer: ranges.length == 0 ? r.startLayer : Math.min(Math.max(ranges[ranges.length - 1].layer + (r.layerChangePoints[r.layerChangePoints.length - 1].upper ? 1 : -1), 0), 2),
    });
    return ranges;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: 80, gap: 16, backgroundColor: "#fff" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 16px 0" }}>
        <div style={{ height: 24, fontSize: 18 }}>{fileHandle?.name || "新規作成"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div onClick={openFile} style={{ display: "flex", alignItems: "center", color: "#48f", cursor: "pointer" }} title="開く">
            <FileOpen style={{ fontSize: 24 }} />
          </div>
          <div onClick={save} style={{ display: "flex", alignItems: "center", color: "#48f", cursor: "pointer" }} title="保存">
            <Save style={{ fontSize: 24 }} />
          </div>
          <div style={{ color: saved ? "#4a4" : "#888", fontSize: 10, backgroundColor: saved ? "#cfc" : "#eee", padding: "0 2px", borderRadius: 4 }}>
            {saved ? "保存済" : autoSave && fileHandle ? "保存中" : "未保存"}
          </div>
          {fileHandle && (
            <label style={{ display: "flex", alignItems: "center", cursor: fileHandle ? "pointer" : "default", fontSize: 12 }}>
              <input
                type="checkbox"
                checked={!!fileHandle && autoSave}
                onChange={() => setAutoSave(prev => !prev)}
                style={{ cursor: fileHandle ? "pointer" : "default" }}
                disabled={!fileHandle}
              />
              自動保存
            </label>
          )}
          {fileReadFailed && (
            <div style={{ fontSize: 10, color: "#f44" }}>読込失敗</div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-start" }}>
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
                        ...inputStyle,
                        width: 120,
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
              { mode: "station", ModeIcon: AddLocationAlt },
              { mode: "station_edit", ModeIcon: EditLocationAlt },
              { mode: "layer", ModeIcon: Layers },
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
              id={"main-svg"}
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
                  mode == "station" ? "pointer" :
                  mode == "layer" ? "pointer" : "default",
              }}
            >
              <rect x={0} y={0} width={size.x} height={size.y} fill="#fff" />
              {bgImage && (
                <image href={bgImage} x={0} y={0} />
              )}

              {/* grid */}
              {showGrid && (
                <>
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
                </>
              )}

              {/* draw preview */}
              {mode == "draw" && mouseXY && selectedRoute.points.length == 0 && (
                <circle cx={mouseXY.x} cy={mouseXY.y} r={8} fill={rgb(selectedRoute.color)} />
              )}
              {mode == "draw" && previewPath && (
                <path
                  d={previewPath.svgPath}
                  stroke="#888"
                  strokeWidth={1}
                  fill="none"
                />
              )}

              {/* routes */}
              {routes.map((route, i) => route.startDirection !== null && (
                <SvgRoutePath
                  key={`routePath_${i}`}
                  setRef={setPathRef}
                  refIdx={i}
                  startDirection={route.startDirection}
                  points={route.points}
                  color={route.color}
                  width={route.width}
                  offset={offset}
                />
              ))}

              {/* routes layer */}
              {layerRanges.map((ranges, i) => {
                const route = routes[i];
                const totalLength = routePathLengths[i];
                return ranges.map((range, j) => route.startDirection !== null && totalLength !== null && range.layer !== 1 && (
                  <SvgRoutePath
                    key={`routeLayer_${i}_${j}`}
                    startDirection={route.startDirection}
                    points={route.points}
                    color={lighten(route.color, range.layer >= 2 ? 1 : -1)}
                    width={route.width / 2}
                    offset={offset}
                    from={meter(Math.min(range.from, totalLength))}
                    to={meter(Math.min(range.to, totalLength))}
                  />
                ))
              })}

              {/* station preview */}
              {mode == "station" && selectedRoute && selectedPathData && previewPoint && (
                <SvgStationPath
                  id="station_preview"
                  svgPath={selectedPathData.svgPath}
                  distance={previewPoint.distance}
                  length={stationLength}
                  color={selectedRoute.color}
                  width={stationWidth}
                  opacity={0.4}
                />
              )}

              {/* stations */}
              {routes.map((route, i) => route.stations.map((station, j) => {
                const key = `station_${i}_${j}`;
                const pathData = routePathData[i];
                const isSelected = mode == "station_edit" && selectedStationIdx && selectedStationIdx.routeIdx == i && selectedStationIdx.stationIdx == j;
                return pathData && (
                  <SvgStationPath
                    key={key}
                    id={key}
                    svgPath={pathData.svgPath}
                    distance={station.distance}
                    length={station.length}
                    color={isSelected ? lighten(route.color, 2) : isHovered(key) ? lighten(route.color, 1) : route.color}
                    width={station.width}
                    left={station.left}
                    platform={station.platform}
                    name={station.name}
                    number={station.number}
                    nameLabelPosition={station.nameLabelPosition}
                    numberLabelPosition={station.numberLabelPosition}
                    onClick={onClickStation}
                    setHoveredAt={setHoveredAt}
                    routeIdx={i}
                    stationIdx={j}
                    mouseEnterEnabled={mode == "station_edit"}
                    style={{ cursor: mode == "station_edit" && !isSelected ? "pointer" : "default" }}
                  />
                );
              }))}

              {/* layer change point */}
              {mode == "layer" && selectedRoute && selectedPathData && previewPoint && (
                <SvgLayerChangePoint
                  id={"layerChange_preview"}
                  svgPath={selectedPathData.svgPath}
                  distance={previewPoint.distance}
                  fromLayer={getLayerAtLength(selectedRoute.startLayer, selectedRoute.layerChangePoints, previewPoint.distance)}
                  upper={upper}
                  color={selectedRoute.color}
                  width={selectedRoute.width * 0.6}
                  opacity={0.6}
                />
              )}

              {/* layer changes */}
              {sortedLayerChangePoints.map((points, i) => points.map((point, j) => {
                const key = `layerChange_${i}_${j}`;
                const pathData = routePathData[i];
                const route = routes[i];
                return pathData && (
                  <SvgLayerChangePoint
                    key={key}
                    id={key}
                    svgPath={pathData.svgPath}
                    distance={point.distance}
                    fromLayer={point.fromLayer}
                    upper={point.upper}
                    color={isHovered(key) ? lighten(route.color, 1) : route.color}
                    width={route.width * 0.6}
                    onClick={onClickLayerChange}
                    setHoveredAt={setHoveredAt}
                    routeIdx={i}
                    stationIdx={j}
                    mouseEnterEnabled={mode == "layer"}
                    style={{ cursor: mode == "layer" ? cursorDelete : "default" }}
                  />
                );
              }))}
            </svg>
          </div>
        </div>

        {/* info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, border: "solid 1px #aab", width: 480, height: 640, padding: 8, fontSize: 12 }}>
          {selectedPath && <div>全長 {Math.round(meter(selectedPath.getTotalLength()) * 10 / 1000) / 10 } km</div>}
          {mode == "view" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 64 }}>サイズ(px)</div>
                <input
                  type="text"
                  value={size.x}
                  style={{ ...inputStyle, width: 48 }}
                  onChange={(e) => setSize(prev => ({ ...prev, x: Math.max(Number(e.target.value) || 0) }))}
                />
                <div>×</div>
                <input
                  type="text"
                  value={size.y}
                  style={{ ...inputStyle, width: 48 }}
                  onChange={(e) => setSize(prev => ({ ...prev, y: Math.max(Number(e.target.value) || 0) }))}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 64 }}>枠移動(px)</div>
                <div>右方向</div>
                <input
                  type="text"
                  value={offset.x}
                  style={{ ...inputStyle, width: 48 }}
                  onChange={(e) => setOffset(prev => ({ ...prev, x: Number(e.target.value) || 0 }))}
                />
                <div>下方向</div>
                <input
                  type="text"
                  value={offset.y}
                  style={{ ...inputStyle, width: 48 }}
                  onChange={(e) => setOffset(prev => ({ ...prev, y: Number(e.target.value) }))}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={showGrid} onChange={() => setShowGrid(prev => !prev)} style={{ cursor: "pointer" }} />
                グリッドを表示
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div>背景画像</div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleBgImage}
                />
              </div>
              <div onClick={toPng} style={{ display: "flex", alignItems: "center", color: "#48f", cursor: "pointer" }} title="PNG出力">
                <FileDownload style={{ fontSize: 24 }} />
                <div>PNG出力</div>
              </div>
            </>
          ) :  mode == "draw" ? (
            <>
              {previewPath && previewPath.lastRadius !== null && selectedRoute.points[selectedRoute.points.length - 1].length !== null && <div>半径 {Math.abs(Math.round(previewPath.lastRadius))} m</div>}
              <button style={{ width: 48 }} onClick={() => reverseRoute(selectedRouteIdx)}>反転</button>
            </>
          ) : mode == "station" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 48 }}>長さ(m)</div>
                <input
                  type="text"
                  value={stationLength}
                  style={{ ...inputStyle, width: 48 }}
                  onChange={(e) => setStationLength(Math.max(Number(e.target.value) || 0, 0))}
                />
                <div style={{ display: "flex" }}>
                  {[
                    { label: "＋", diff: 1 },
                    { label: "－", diff: -1 },
                  ].map(b => (
                    <button
                      key={`changeLength_${b.label}`}
                      style={moveButtonStyle}
                      onClick={() => setStationLength(Math.max(stationLength + b.diff, 0))}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 48 }}>幅(m)</div>
                <input
                  type="text"
                  value={stationWidth}
                  style={{ ...inputStyle, width: 48 }}
                  onChange={(e) => setStationWidth(Math.max(Number(e.target.value) || 0, 0))}
                />
                <div style={{ display: "flex" }}>
                  {[
                    { label: "＋", diff: 1 },
                    { label: "－", diff: -1 },
                  ].map(b => (
                    <button
                      key={`changeWidth_${b.label}`}
                      style={moveButtonStyle}
                      onClick={() => setStationWidth(Math.max(stationWidth + b.diff, 0))}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              {previewFromPrev !== null && <div>前の駅から {Math.round(meter(previewFromPrev) * 10 / 1000) / 10 } km</div>}
              {previewToNext !== null && <div>次の駅まで {Math.round(meter(previewToNext) * 10 / 1000) / 10 } km</div>}
            </>
          ) : mode == "station_edit" ? selectedStationIdx && selectedStation && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80 }}>駅名</div>
                <input
                  type="text"
                  value={selectedStation.name}
                  style={{ ...inputStyle, width: 144 }}
                  onChange={(e) => updateStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, { name: e.target.value })}
                />
                <div style={{ display: "flex" }}>
                  {[
                    { label: "≪", diff: { x: -30, y: 0 } },
                    { label: "≫", diff: { x: 30, y: 0 } },
                    { label: "←", diff: { x: -3, y: 0 } },
                    { label: "→", diff: { x: 3, y: 0 } },
                    { label: "↑", diff: { x: 0, y: -3 } },
                    { label: "↓", diff: { x: 0, y: 3 } },
                  ].map(b => (
                    <button
                      key={`moveName_${b.label}`}
                      style={moveButtonStyle}
                      onClick={() => moveStationLabel(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, "name", b.diff)}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80 }}>番号</div>
                <input
                  type="text"
                  value={selectedStation.number}
                  style={{ ...inputStyle, width: 48 }}
                  onChange={(e) => updateStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, { number: e.target.value })}
                />
                <div style={{ display: "flex" }}>
                  {[
                    { label: "≪", diff: { x: -30, y: 0 } },
                    { label: "≫", diff: { x: 30, y: 0 } },
                    { label: "←", diff: { x: -3, y: 0 } },
                    { label: "→", diff: { x: 3, y: 0 } },
                    { label: "↑", diff: { x: 0, y: -3 } },
                    { label: "↓", diff: { x: 0, y: 3 } },
                  ].map(b => (
                    <button
                      key={`moveNumber_${b.label}`}
                      style={moveButtonStyle}
                      onClick={() => moveStationLabel(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, "number", b.diff)}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex" }}>
                  <button onClick={() => autofillStationNumber(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, true)}>
                    前駅+1
                  </button>
                  <button onClick={() => autofillStationNumber(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, false)}>
                    次駅+1
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80 }}>長さ(m)</div>
                <input
                  type="text"
                  value={selectedStation.length}
                  style={{ ...inputStyle, width: 48 }}
                  onChange={(e) => updateStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, { length: Math.max(Number(e.target.value) || 0, 0) })}
                />
                <div style={{ display: "flex" }}>
                  {[
                    { label: "＋", diff: 1 },
                    { label: "－", diff: -1 },
                  ].map(b => (
                    <button
                      key={`changeLength_${b.label}`}
                      style={moveButtonStyle}
                      onClick={() => updateStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, { length: Math.max(selectedStation.length + b.diff, 0) })}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 80 }}>幅(m)</div>
                <input
                  type="text"
                  value={selectedStation.width}
                  style={{ ...inputStyle, width: 48 }}
                  onChange={(e) => updateStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, { width: Math.max(Number(e.target.value) || 0, 0) })}
                />
                <div style={{ display: "flex" }}>
                  {[
                    { label: "＋", diff: 1 },
                    { label: "－", diff: -1 },
                  ].map(b => (
                    <button
                      key={`changeWidth_${b.label}`}
                      style={moveButtonStyle}
                      onClick={() => updateStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, { width: Math.max(selectedStation.width + b.diff, 0) })}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 120 }}>中心からのずれ(m)</div>
                <input
                  type="text"
                  value={selectedStation.left}
                  style={{ ...inputStyle, width: 48 }}
                  onChange={(e) => updateStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, { left: Math.min(Math.max(Number(e.target.value) || 0, -selectedStation.width / 2), selectedStation.width / 2) })}
                />
                <div style={{ display: "flex" }}>
                  {[
                    { label: "＋", diff: 1 },
                    { label: "－", diff: -1 },
                  ].map(b => (
                    <button
                      key={`changeLeft_${b.label}`}
                      style={moveButtonStyle}
                      onClick={() => updateStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, { left: Math.min(Math.max(selectedStation.left + b.diff, -selectedStation.width / 2), selectedStation.width / 2) })}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 120 }}>ホーム(0/1)</div>
                <input
                  type="text"
                  value={selectedStation.platform}
                  style={{ ...inputStyle, width: 120 }}
                  onChange={(e) => updateStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, { platform: Array.from(e.target.value).filter(c => c == "0" || c == "1").join("") })}
                />
                <div style={{ display: "flex" }}>
                  {["1001", "010", "01010"].map(b => (
                    <button
                      key={`changePlatform_${b}`}
                      style={{ ...moveButtonStyle, width: 56 }}
                      onClick={() => updateStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx, { platform: b })}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
              {selectedFromPrev !== null && <div>前の駅から {Math.round(meter(selectedFromPrev) * 10 / 1000) / 10 } km</div>}
              {selectedToNext !== null && <div>次の駅まで {Math.round(meter(selectedToNext) * 10 / 1000) / 10 } km</div>}
              <div style={{ marginTop: "auto", marginLeft: "auto" }}>
                <Delete style={{ color: "#f44", cursor: "pointer" }} onClick={() => deleteStation(selectedStationIdx.routeIdx, selectedStationIdx.stationIdx)} />
              </div>
            </>
          ) : mode == "layer" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input type="radio" checked={upper} onChange={() => setUpper(true)} style={{ cursor: "pointer" }} />
                  上方向
                </label>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input type="radio" checked={!upper} onChange={() => setUpper(false)} style={{ cursor: "pointer" }} />
                  下方向
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 40 }}>初期値</div>
                {[
                  { label: "地下", value: 0 },
                  { label: "地上", value: 1 },
                  { label: "高架", value: 2 },
                ].map(b => (
                  <label key={`startLayer_${b.label}`} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="radio"
                      checked={selectedRoute.startLayer == b.value}
                      onChange={() => updateRoute(selectedRouteIdx, { ...selectedRoute, startLayer: b.value })}
                      style={{ cursor: "pointer" }}
                    />
                    {b.label}
                  </label>
                ))}
              </div>
            </>
          ) : <></>}
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
  setRef?: (elm: SVGPathElement | null, i: number) => void;
  refIdx?: number;
  startDirection: number;
  points: RoutePoint[];
  color: HSV;
  width: number;
  offset: XY;
  from?: number;
  to?: number;
};

const isSameObj = <T,>(prev: T, next: T) => {
  return !prev || !next ? Object.is(prev, next) :
    (Object.keys(prev) as (keyof T)[]).every((key) => Object.is(prev[key], next[key]))
};

const SvgRoutePath = React.memo(function SvgRoutePath(props: RoutePathProps) {
  console.log("rendered")
  return (
    <path
      ref={elm => { if (props.setRef && props.refIdx !== undefined) { props.setRef(elm, props.refIdx); }}}
      d={calcPath(props.startDirection, props.points, props.offset, props.from, props.to).svgPath}
      stroke={rgb(props.color)}
      strokeWidth={props.width}
      fill="none"
    />
  );
}, (prev, next) => {
  for (const key of Object.keys(prev) as (keyof RoutePathProps)[]) {
    if (key === "points" || key === "color" || key == "offset") continue;
    if (!Object.is(prev[key], next[key])) {
      return false;
    }
  }
  return (
    prev.points.length == next.points.length && prev.points.every((prevP, i) => isSameObj(prevP, next.points[i])) &&
    isSameObj(prev.color, next.color) &&
    isSameObj(prev.offset, next.offset)
  );
});

type StationPathProps = {
  id: string;
  svgPath: string;
  distance: number;
  length: number;
  color: HSV;
  width: number;
  left?: number;
  platform?: string;
  name?: string;
  number?: string;
  nameLabelPosition?: XY;
  numberLabelPosition?: XY;
  opacity?: number;
  onClick?: (e: React.MouseEvent<SVGPathElement>, routeIdx: number, stationIdx: number) => void;
  setHoveredAt?: React.Dispatch<string | null>;
  routeIdx?: number;
  stationIdx?: number;
  mouseEnterEnabled?: boolean;
  style?: React.CSSProperties;
};

const SvgStationPath = React.memo(function SvgStationPath(props: StationPathProps) {
  const pathElm = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathElm.setAttribute("d", props.svgPath);
  const totalLength = pathElm.getTotalLength();
  const centerPoints = Array.from({ length: 15 }).map((_, i) => {
    const distance = props.distance + px(props.length) * (i - 7) / (7 * 2);
    const p = pathElm.getPointAtLength(distance);
    const direction = getDirectionAtLength(pathElm, distance);
    return { x: p.x, y: p.y, distance, direction };
  });
  const stationPoints = centerPoints.map(p => getSidePoint(p.x, p.y, p.direction, px(props.left || 0)));
  const platformCount = props.platform?.length || 0;
  const platformWidth = platformCount ? px(props.width / platformCount) : 0;
  const platformPaths = props.platform ? Array.from(props.platform).map((f, i) => f == "1" ?
    stationPoints.map(p => getSidePoint(p.x, p.y, p.direction, px(props.width / 2 - i * props.width / platformCount) - platformWidth / 2)) : null) : null;
  return 0 <= props.distance && props.distance <= totalLength && (
    <>
      <path
        d={`M${stationPoints.map(p => `${p.x} ${p.y}`).join("L")}`}
        stroke={rgb(props.color)}
        strokeWidth={px(props.width) + 8}
        fill="none"
        onClick={(e) => props.onClick && props.routeIdx !== undefined && props.stationIdx !== undefined && props.onClick(e, props.routeIdx, props.stationIdx)}
        onMouseEnter={() => { if (props.mouseEnterEnabled && props.setHoveredAt) { props.setHoveredAt(props.id) } }}
        onMouseLeave={() => props.setHoveredAt && props.setHoveredAt(null)}
        opacity={0}
        style={{ ...props.style }}
      />
      <path
        d={`M${stationPoints.map(p => `${p.x} ${p.y}`).join("L")}`}
        stroke={rgb(props.color)}
        strokeWidth={px(props.width)}
        strokeOpacity={props.opacity}
        fill="none"
        style={{ pointerEvents: "none" }}
      />
      {platformPaths?.map((p, i) => p && (
        <path
          key={`platform_${i}`}
          d={`M${p.map(p => `${p.x} ${p.y}`).join("L")}`}
          stroke={rgb({ h: props.color.h + 180, s: 80, v: 100 })}
          strokeWidth={platformWidth}
          strokeOpacity={props.opacity}
          fill="none"
          style={{ pointerEvents: "none" }}
        />
      ))}
      {props.name && (
        <text
          x={centerPoints[7].x + (props.nameLabelPosition?.x || 0)}
          y={centerPoints[7].y + (props.nameLabelPosition?.y || 0)}
          fill={rgb({ h: 225, s: 80, v: 60 })}
          style={{ fontSize: 20, pointerEvents: "none" }}
        >
          {props.name}
        </text>
      )}
      {props.number && (
        <text
          x={centerPoints[7].x + (props.numberLabelPosition?.x || 0)}
          y={centerPoints[7].y + (props.numberLabelPosition?.y || 0)}
          fill={rgb({ h: 225, s: 80, v: 60 })}
          style={{ fontSize: 12, pointerEvents: "none" }}
        >
          {props.number}
        </text>
      )}
    </>
  );
}, (prev, next) => {
  for (const key of Object.keys(prev) as (keyof StationPathProps)[]) {
    if (
      key === "color" || key === "nameLabelPosition" || key == "numberLabelPosition" || key === "style"
    ) continue;
    if (!Object.is(prev[key], next[key])) {
      return false;
    }
  }
  return (
    isSameObj(prev.color, next.color) &&
    isSameObj(prev.nameLabelPosition, next.nameLabelPosition) &&
    isSameObj(prev.numberLabelPosition, next.numberLabelPosition) &&
    isSameObj(prev.style, next.style)
  );
});

type LayerChangePointProps = {
  id: string;
  svgPath: string;
  distance: number;
  fromLayer: number;
  upper: boolean;
  color: HSV;
  width: number;
  opacity?: number;
  onClick?: (e: React.MouseEvent<SVGPathElement>, routeIdx: number, pointIdx: number) => void;
  setHoveredAt?: React.Dispatch<string | null>;
  routeIdx?: number;
  stationIdx?: number;
  mouseEnterEnabled?: boolean;
  style?: React.CSSProperties;
};

const SvgLayerChangePoint = React.memo(function SvgLayerChangePoint(props: LayerChangePointProps) {
  const pathElm = document.createElementNS("http://www.w3.org/2000/svg", "path");
  pathElm.setAttribute("d", props.svgPath);
  const totalLength = pathElm.getTotalLength();
  const direction = getDirectionAtLength(pathElm, props.distance);
  const isArc = props.upper ? props.fromLayer <= 0 : props.fromLayer <= 1;
  const noChange = props.upper ? props.fromLayer < 0 || 2 <= props.fromLayer : props.fromLayer <= 0 || 2 < props.fromLayer;
  const p = pathElm.getPointAtLength(props.distance);
  const nx = Math.cos(direction + Math.PI / 2) * (props.upper ? 1 : -1);
  const ny = Math.sin(direction + Math.PI / 2) * (props.upper ? 1 : -1);
  const dx = Math.cos(direction) * (props.upper ? 1 : -1);
  const dy = Math.sin(direction) * (props.upper ? 1 : -1);
  const size = props.width * 2;
  const px1 = p.x + nx * size; const py1 = p.y + ny * size;
  const px2 = px1 + dx * size; const py2 = py1 + dy * size;
  const px3 = p.x - nx * size; const py3 = p.y - ny * size;
  const px4 = px3 + dx * size; const py4 = py3 + dy * size;
  const path = isArc ? `M${px2} ${py2}A${size} ${size} 0 0 1 ${px4} ${py4}` :
    `M${px2} ${py2}L${px1} ${py1}L${px3} ${py3}L${px4} ${py4}`;
  return 0 <= props.distance && props.distance <= totalLength && (
    <>
      <path
        d={path}
        stroke={rgb(props.color)}
        strokeWidth={props.width + 8}
        fill="none"
        onClick={(e) => props.onClick && props.routeIdx !== undefined && props.stationIdx !== undefined && props.onClick(e, props.routeIdx, props.stationIdx)}
        onMouseEnter={() => { if (props.mouseEnterEnabled && props.setHoveredAt) { props.setHoveredAt(props.id) } }}
        onMouseLeave={() => props.setHoveredAt && props.setHoveredAt(null)}
        opacity={0}
        style={{ ...props.style }}
      />
      <path
        d={path}
        stroke={rgb(props.color)}
        strokeWidth={props.width}
        strokeOpacity={noChange ? (props.opacity ?? 1) * 0.4 : (props.opacity ?? 1)}
        fill="none"
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}, (prev, next) => {
  for (const key of Object.keys(prev) as (keyof LayerChangePointProps)[]) {
    if (
      key === "color" || key === "style"
    ) continue;
    if (!Object.is(prev[key], next[key])) {
      return false;
    }
  }
  return (
    isSameObj(prev.color, next.color) &&
    isSameObj(prev.style, next.style)
  );
});