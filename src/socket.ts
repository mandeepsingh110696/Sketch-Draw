import {io} from "socket.io-client"
const URL = process.env.NODE_ENV === "production"   ? ""  : 'http://localhost:8500'
export const socket = io(URL)