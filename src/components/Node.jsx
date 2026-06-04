import {useState, useEffect} from 'react'
import { NODE_SHAPES } from '../constraints';

//ノード
function Node({node, clickedNodeId, setClickedNodeId, sendBoardDatasEvent}){
  //テキストをnode要素に保持するためのstate
  const [text, setText] = useState(node.text);
  //選択時の背景色
  let color = (node.id == clickedNodeId) ? '#00AACC' : '#FFFFFF';

  //node.textが更新されていたらそっちにtextを合わせる
  if(text != node.text){
    setText(node.text);
  }

  
  return(
    <div
      style={{
        width: node.width, 
        height: node.height, 
        display: 'block',
        position: 'absolute', 
        top: node.y, 
        left: node.x,
        backgroundColor: color,
        padding: '1%',
      }}
    >
      <img 
      src={node.shape == NODE_SHAPES.decide.name && node.ynInvert 
        ? NODE_SHAPES.decideInvert.img 
        : NODE_SHAPES[node.shape].img}  
      style={{
        display: 'block',
        width: '100%', 
        height: '100%'}}
      />
      <input
        onClick={onNodeClicked}
        type='text'
        value={text}
        onChange={(e)=>onChangeText(e.target.value)}
        style={{
          position: 'absolute',
          width: '95%',
          height: '95%',
          top: '50%', 
          left: '50%',
          transform: 'translate(-50%, -50%)', // 中央寄せのポイント
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          textAlign: 'center'
        }}
      ></input>
    </div>
  )

  function onChangeText(inputText){
    setText(inputText);
    node.text = inputText;
    sendBoardDatasEvent();
  }

  //ノードがクリックされたらその情報を上位コンポーネントのstateにset
  function onNodeClicked(){
    setClickedNodeId(node.id);
  }
}

export default Node
