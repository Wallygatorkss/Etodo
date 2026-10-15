import React, { type PropsWithChildren } from "react";

function Corps({ children }: PropsWithChildren<{}>) {
  return <div className="flex flex-row">{children}</div>;
}

export { Corps };