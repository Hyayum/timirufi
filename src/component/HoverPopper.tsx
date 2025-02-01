import { useRef, useState } from "react";
import {
  Box,
  Paper,
  Popper,
  PopperPlacementType,
  Typography,
} from "@mui/material";

const HoverPopper = ({
  text,
  placement = "top-start",
  children,
}: {
  text: string;
  placement?: PopperPlacementType;
  children: React.ReactNode;
}) => {
  const childrenRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Popper
        open={open}
        anchorEl={childrenRef.current}
        placement={placement}
      >
        <Paper elevation={3} sx={{ p: 1 }}>
          <Typography variant="body2">
            {text}
          </Typography>
        </Paper>
      </Popper>
      <Box
        ref={childrenRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </Box>
    </>
  );
};

export default HoverPopper