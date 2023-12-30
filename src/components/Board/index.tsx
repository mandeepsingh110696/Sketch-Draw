import { MENU_ITEMS } from "@/constants"
import { actionItemClick } from "@/slice/menuSlice"
import React, { useEffect, useLayoutEffect, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { socket } from "@/socket"
const Board = () => {
  const dispatch = useDispatch()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const shouldDraw = useRef<boolean>(false)
  const historyDraw = useRef<ImageData[]>([])
  const historyPointer = useRef(0)
  const { activeMenuItem, actionMenuItem } = useSelector(
    (state) => (state as any).menu
  )
  const { color, size } = useSelector(
    (state) => (state as any).toolbox[activeMenuItem]
  )

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (actionMenuItem === MENU_ITEMS.DOWNLOAD) {
      const URL = canvas.toDataURL()
      const anchor = document.createElement("a")
      anchor.href = URL
      anchor.download = "sketch.jpg"
      anchor.click()
      console.log({ URL })
    } else if (
      actionMenuItem === MENU_ITEMS.UNDO ||
      actionMenuItem === MENU_ITEMS.REDO
    ) {
      if (historyPointer.current > 0 && actionMenuItem === MENU_ITEMS.UNDO)
        historyPointer.current -= 1
      if (
        historyPointer.current < historyDraw.current.length - 1 &&
        actionMenuItem === MENU_ITEMS.REDO
      )
        historyPointer.current += 1
      const imageData = historyDraw.current[historyPointer.current]
      context?.putImageData(imageData, 0, 0)
    }
    dispatch(actionItemClick(null))
    console.log({ actionMenuItem })
  }, [actionMenuItem, dispatch])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    const changeConfig = (color:any,size:any) => {
      if (context) {
        context.strokeStyle = color
        context.lineWidth = size
      }
    }

    const handleChangeConfig = (config:any)=>{
      console.log({config})
       changeConfig(config.color,config.size)
    }
    changeConfig(color,size)
    socket.on("changeConfig",handleChangeConfig)

    return () =>{
       socket.off("changeConfig",handleChangeConfig)
    }
  }, [color, size])

  // Before browser paint stuff
  useLayoutEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    // when component mounts
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const beginPath = (x: number, y: number) => {
      context?.beginPath()
      context?.moveTo(x, y)
    }

    const drawLine = (x: number, y: number) => {
      context?.lineTo(x, y)
      context?.stroke()
    }
    const handleMouseDown = (e: any) => {
      shouldDraw.current = true
      beginPath(e.clientX, e.clientY)
      socket.emit("beginPath",{x: e.clientX, y: e.clientY})
    }
    //should draw
    const handleMouseMove = (e: any) => {
      if (!shouldDraw.current) return
      drawLine(e.clientX, e.clientY)
      socket.emit("drawLine",{x: e.clientX, y: e.clientY});
    }

    // should not draw
    const handleMouseUp = (e: any) => {
      shouldDraw.current = false
      const imageData = context?.getImageData(0, 0, canvas.width, canvas.height)
      historyDraw.current.push(imageData!)
      historyPointer.current = historyDraw.current.length - 1
    }

    const handleBeginPath = (path:any) => {
      beginPath(path.x,path.y)
    }
    const handleDrawLine=(path:any)=>{
      drawLine(path.x,path.y);
    }
    canvas.addEventListener("mousedown", handleMouseDown, false)
    canvas.addEventListener("mousemove", handleMouseMove, false)
    canvas.addEventListener("mouseup", handleMouseUp, false)


    socket.on("beginPath",handleBeginPath)
    socket.on("drawLine", handleDrawLine)

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown, false)
      canvas.removeEventListener("mousemove", handleMouseMove, false)
      canvas.removeEventListener("mouseup", handleMouseUp, false)

      socket.off("beginPath",handleBeginPath);
      socket.off("drawLine", handleDrawLine);
    }
  }, [])
  return (
    <div>
      <canvas ref={canvasRef}></canvas>
    </div>
  )
}

export default Board
