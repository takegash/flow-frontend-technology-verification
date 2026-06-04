import { useState, useRef } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Button } from 'bootstrap'
import { NODE_SHAPES } from './constraints'
import NodePallet from './components/NodePallet'
import Board from './components/Board'
import { WebSocketProvider } from './components/WebSocket'


function App() {
  //次に配置するshape
  const [drawShape, setDrawShape] = useState(NODE_SHAPES.terminator.name);
  //クリックされたノードのid
  const [clickedNodeId, setClickedNodeId] = useState(null);
  //node情報が保存されるObject
  const [nodes, setNodes] = useState({
    0:{id: 0, shape: NODE_SHAPES.terminator.name, text: "", x:0, y:0, width:220, height:70,branch: 0, nexts: {/*2: {direction: 'down'}*/}, prevs: {}, disabledBtnDirections: ['up', 'right', 'left'], ynInvert: false},
    //1:{id: 1, shape: nodeShapes.process.name, text: "abc", x:0, y:0, branch: 1, nexts: {}, prevs: {}},
    //2:{id: 2, shape: nodeShapes.process.name, text: "abc", x:0, y:0, branch: 1, nexts: {1: {direction: 'down'}, 3: {direction: 'right'}}, prevs: {}},
    //3:{id: 3, shape: nodeShapes.process.name, text: "abc", x:0, y:0, branch: 1, nexts: {}, prevs: {}}
  });
  //branch(フローチャート内の縦のまとまり)の情報を管理
  let [branches, setBranches] = useState({});

  //デバッグ用に4から
  let nodeNum = useRef(4);
  //branchの数(兼branchのid)
  let branchNum = useRef(1);

  //boardでフローチャートを配置したいエリアのref
  const boardRef = useRef(null);

  if(clickedNodeId != null && !(clickedNodeId in nodes)){
    setClickedNodeId(null);
  }
  
  return (
    <>
      <WebSocketProvider 
        nodeNum={nodeNum}
        setNodes={setNodes}
        branchNum={branchNum}
        setBranches={setBranches}
      >
        <div className='row'>
          <aside className='position-fixed col-3 col-md-2 col-lg-1' 
          style={{
            zIndex: 1,
            backgroundColor: '#CCCCCC',
          }}>
            <NodePallet drawShape={drawShape} setDrawShape={setDrawShape}/>
          </aside>
          <div className='col-9 offset-2' style={{zIndex: 0}}>
            <div className='offset-3'>
              <div ref={boardRef}>
                <Board 
                  nodes={nodes} 
                  setNodes={setNodes}
                  branches={branches}
                  setBranches={setBranches}
                  nodeNum={nodeNum}
                  branchNum={branchNum}
                  drawShape={drawShape}
                  clickedNodeId={clickedNodeId}
                  setClickedNodeId={setClickedNodeId}
                  boardRef={boardRef}
                />
              </div>
            </div>
          </div>
        </div>
      </WebSocketProvider>
    </>
  )
}

export default App
