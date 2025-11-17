"use client";

import * as React from "react";

export interface ResponseContextValue {
  status: "idle" | "loading" | "success" | "error";
  responseId: string | number | undefined;
  isLatest: boolean;
}

export const ResponseContext = React.createContext<ResponseContextValue>({
  status: "idle",
  responseId: undefined,
  isLatest: false,
});

export const useResponseContext = (): ResponseContextValue => {
  return React.useContext(ResponseContext);
};

