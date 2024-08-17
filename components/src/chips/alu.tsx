import {
  COMMANDS_ALU,
  COMMANDS_OP,
  Flags,
} from "@nand2tetris/simulator/cpu/alu.js";

export const ALUComponent = ({
  A,
  op,
  D,
  out,
  flag,
  stroke_color,
}: {
  A: number;
  op: COMMANDS_OP;
  D: number;
  out: number;
  flag: keyof typeof Flags;
  stroke_color: "black" | "white";
}) => {

  const fill = stroke_color === "black" ? "#000000" : "#FFFFFF";
  return (
  <div className="alu">
    <span>ALU</span>
    <svg width="250" height="250" version="1.1">
      <defs>
        <rect
            x="34.442518"
            y="54.335354"
            width="0.91770717"
            height="20.780869"
        />
      </defs>
      <g>
        <polygon
            points="70,10 180,85 180,165 70,240 70,135 90,125 70,115"
            stroke="#000"
            fill="#6D97AB"
        />
        <text
            xmlSpace="preserve"
            textAnchor="middle"
            y="61"
            x="35"
            fill={fill}
        >
          {A}
        </text>
        <text
            xmlSpace="preserve"
            textAnchor="middle"
            y="176"
            x="35"
            fill={fill}
        >
          {D}
        </text>
        <text
            xmlSpace="preserve"
            textAnchor="middle"
            y="121"
            x="207"
            fill={fill}
        >
          {out}
        </text>
        <text
            xmlSpace="preserve"
            y="130.50002"
            x="110.393929"
            fill={fill}
            fontSize={24}
        >
          {COMMANDS_ALU.op[op] ?? "(??)"}
        </text>
        <g>
          <path stroke={stroke_color} d="M 6,67.52217 H 68.675994"/>
          <path stroke={stroke_color} d="M 68.479388,67.746136 60.290279,61.90711"/>
          <path stroke={stroke_color} d="m 68.479388,67.40711 -8.189109,5.839026"/>
        </g>
        <g transform="translate(0,115.5)">
          <path stroke={stroke_color} d="M 6,67.52217 H 68.675994"/>
          <path d="M 68.479388,67.746136 60.290279,61.90711" stroke={stroke_color}/>
          <path stroke={stroke_color} d="m 68.479388,67.40711 -8.189109,5.839026"/>
        </g>
        <g transform="translate(176,57.5)">
          <path stroke={stroke_color} d="M 6,67.52217 H 68.675994"/>
          <path stroke={stroke_color} d="M 68.479388,67.746136 60.290279,61.90711"/>
          <path stroke={stroke_color} d="m 68.479388,67.40711 -8.189109,5.839026"/>
        </g>
      </g>
    </svg>
  </div>
)
}
