import { NODE_SHAPES } from "../constraints"
import NodePalletItem from './NodePalletItem'

//次に配置するshapeを選択するパレット
function NodePallet({drawShape, setDrawShape}){
  return(
    <div style={{zIndex: 0}}>
      ShapeList
      <ul className='nav flex-column'>
        {Object.values(NODE_SHAPES)
          .filter(
            (shape)=>
              shape != NODE_SHAPES.arrow && 
              shape != NODE_SHAPES.point
          )
          .map(
            (shape) => 
              <NodePalletItem 
                key={shape.id} 
                shape={shape} 
                drawShape={drawShape}
                setDrawShape={setDrawShape}
              />
          )
        }
      </ul>
    </div>
  )
}

export default NodePallet
