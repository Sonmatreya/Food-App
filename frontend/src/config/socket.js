import { io } from "socket.io-client";
import { API_URL } from "./api";

export const createSocket = () =>
  io(API_URL, {
    withCredentials: true,
  });
