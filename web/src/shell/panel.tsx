import { CSSProperties, ReactNode,
  useEffect,useState,useRef} from "react";
import "./../pico/accordion.scss";

export const Panel = (props: {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
  isEditorPanel?: boolean;
  panelRef?: React.RefObject<HTMLDivElement>;
}) => {


  return (
    <article
      className={[
        "panel",
        props.className ?? "",
        props.isEditorPanel ? "editor" : "",
      ].join(" ")}
       ref={props.panelRef}
    >
      {props.header && <header>{props.header}</header>}
      <main>{props.children}</main>
      {props.footer && <footer>{props.footer}</footer>}
    </article>
  );
};

export const Accordian = (props: {
  children: ReactNode;
  summary: ReactNode;
  className?: string;
  style?: CSSProperties;
  open?: boolean;
}) => {
  return (
    <details
      className={props.className ?? ""}
      open={props.open}
      style={props.style}
    >
      <summary>
        <div className="flex row align-baseline">{props.summary}</div>
      </summary>
      {props.children}
    </details>
  );
};
