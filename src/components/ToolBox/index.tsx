import React from 'react'
import styles from './index.module.css'
import cx from "classnames"
import { COLORS, MENU_ITEMS } from '@/constants'
import { useDispatch, useSelector } from 'react-redux'
import { changeBrushSize, changeColor } from '@/slice/toolboxslice'
import { socket } from '@/socket'
const ToolBox = () => {
   const dispatch  = useDispatch()
   const activeMenuItem = useSelector((state) => (state as any).menu?.activeMenuItem)
   const showStork= activeMenuItem === MENU_ITEMS.PENCIL
   const showBrush = activeMenuItem === MENU_ITEMS.PENCIL || activeMenuItem === MENU_ITEMS.ERASER
   const {color,size} = useSelector((state) => (state as any).toolbox[activeMenuItem])
    const updateBrushSize= (e:any) => {
      console.log({color})
      dispatch(changeBrushSize({item:activeMenuItem,size:e.target.value}))
      socket.emit("changeConfig",{color,size:e.target.value})
    }

    const updateColor = (newColor:any) => {
      dispatch(changeColor({item:activeMenuItem,color:newColor}))
      socket.emit("changeConfig",{color:newColor,size})
    }
  return (
    <div className={styles.toolBoxContainer}>
      {
         showStork &&
         <div className={styles.toolItem}>
         <h4 className={styles.toolText}>Stroke Color</h4>

          <div className={styles.itemContainer} >
             <div className={cx(styles.colorBox,{[styles.active]: color=== COLORS.BLACK})}  style={{backgroundColor: COLORS.BLACK}} onClick={()=> updateColor(COLORS.BLACK)}/>
             <div className={cx(styles.colorBox,{[styles.active]: color=== COLORS.RED})} style={{backgroundColor: COLORS.RED}} onClick={()=> updateColor(COLORS.RED)}/>
             <div className={cx(styles.colorBox,{[styles.active]: color=== COLORS.GREEN})} style={{backgroundColor: COLORS.GREEN}} onClick={()=> updateColor(COLORS.GREEN)}/>
             <div className={cx(styles.colorBox,{[styles.active]: color=== COLORS.BLUE})} style={{backgroundColor: COLORS.BLUE}} onClick={()=> updateColor(COLORS.BLUE)}/>
             <div className={cx(styles.colorBox,{[styles.active]: color=== COLORS.ORANGE})} style={{backgroundColor: COLORS.ORANGE}} onClick={()=> updateColor(COLORS.ORANGE)}/>
             <div className={cx(styles.colorBox,{[styles.active]: color=== COLORS.YELLOW})} style={{backgroundColor: COLORS.YELLOW}} onClick={()=> updateColor(COLORS.YELLOW)}/>
             <div className={cx(styles.colorBox,{[styles.active]: color=== COLORS.WHITE})}  style={{backgroundColor: COLORS.WHITE}} onClick={()=> updateColor(COLORS.WHITE)}/>
          </div>
      </div>
      }
       
       {
         showBrush && 
         <div className={styles.toolItem} >
         <h4 className={styles.toolText}>Brush Size</h4>

          <div className={styles.itemContainer}>
             <input type="range" min={1} max={10} step={1} onChange={updateBrushSize} />
          </div>
      </div>
       }

      

    </div>
  )
}

export default ToolBox;