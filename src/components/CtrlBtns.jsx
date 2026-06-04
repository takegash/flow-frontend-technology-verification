import {useState, useEffect} from 'react'
import { useWebSocket } from './WebSocket';

//ノード操作ボタン
function CtrlBtns({nodes, branches, nodeNum, branchNum, clickedNodeId, drawShape, CreateNode, InsertChildNodeDown, AddFork, DeleteNode, WaitSelectEdge}){
  let [isBtnsDisabled, setIsBtnsDisabled] = useState({
    'up': true,
    'down': true,
    'right': true,
    'left': true
  });

  //WebSocketの参照
  const {sendBoardDatas, messages} = useWebSocket();

  //クリックされたnodeが更新されたら、ボタンの操作可否を更新する
  useEffect(()=>{
    UpdateDisabledBtn();
  }, [clickedNodeId, nodes])

  return(
    <>
      <div className='row offset-3'>
        <button 
          className='offset-4 col-4 btn btn-secondary'
          onClick={()=>onInsertButtonClick('up')}
          disabled={isBtnsDisabled['up']}
        >up</button>
      </div>
      <div className='row offset-3'>
        <button 
        className='col-4 btn btn-secondary'
        onClick={()=>onInsertButtonClick('left')}
        disabled={isBtnsDisabled['left']}
        >left</button>
        <button 
        className='col-4 btn btn-secondary'
        onClick={()=>onInsertButtonClick('down')}
        disabled={isBtnsDisabled['down']}
        >down</button>
        <button 
        className='col-4 btn btn-secondary'
        onClick={()=>onInsertButtonClick('right')}
        disabled={isBtnsDisabled['right']}
        >right</button>
      </div>
      <div className='row offset-3'>
        <button 
        className='col-12 btn btn-danger'
        onClick={onDeleteButtonClick}
        >
          delete
        </button>
      </div>
    </>
  )

  

  //4方向の挿入ボタンを押したとき
  function onInsertButtonClick(direction){
    //console.log(clickedNodeId);
    if(clickedNodeId == null){
      return
    }
    

    switch(direction){
      case 'up':{
        
        let prevs = nodes[clickedNodeId].prevs;
        Object.entries(prevs).map(([prevId, prev]) => {
          console.log("prev:"+prev.direction);
          if(prev.direction == 'up'){
            /*nodeを生成*/
            let newId = CreateNode(drawShape);
            InsertChildNodeDown(newId, prevId);
            sendBoardDatas(nodeNum, nodes, branchNum, branches);
          }
        });
        break;
      }
      case 'down':{
        /*nodeを生成*/
        let newId = CreateNode(drawShape);
        InsertChildNodeDown(newId, clickedNodeId);
        sendBoardDatas(nodeNum, nodes, branchNum, branches);
        break;
      }
      case 'right':{
        /*nodeを生成*/
        let newId = CreateNode(drawShape);
        //console.log(newId, clickedNodeId)
        AddFork(newId, clickedNodeId);
        sendBoardDatas(nodeNum, nodes, branchNum, branches);
        break;
      }
      case 'left':{
        //edge選択待ち状態へ
        WaitSelectEdge();
        break;
      }
    }
    
    //nodeの接続に伴ってボタン状態の変更も発生する
    UpdateDisabledBtn();
    //console.log(newId);
  }

  //deleteボタンを押したとき
  function onDeleteButtonClick(){
    DeleteNode(clickedNodeId);
  }

  //操作ボタンの選択可否を更新
  function UpdateDisabledBtn(){
    if(clickedNodeId == null){
      return;
    }
    let isBtnsDisabledNext = {
      'up': false,
      'down': false,
      'right': false,
      'left': false
    };
    //console.log(clickedNodeId);

    nodes[clickedNodeId].disabledBtnDirections.map((direction)=>{
      switch(direction){
        case 'up':
          isBtnsDisabledNext['up'] = true;
          break;
        case 'down':
          isBtnsDisabledNext['down'] = true;
          break;
        case 'right':
          isBtnsDisabledNext['right'] = true;
          break;
        case 'left':
          isBtnsDisabledNext['left'] = true;
          break;
      }
    });

    //既に右に分岐済みだったら右に分岐できないように(decideかどうかはチェックしてない)
    Object.values(nodes[clickedNodeId].nexts).map((next)=>{
      if(next.direction == 'right'){
        isBtnsDisabledNext['right'] = true;
      }
    });

    //console.log("branch:"+nodes[clickedNodeId].branch);
    //クリックされてるnodeのbranch番号
    let branchId = nodes[clickedNodeId].branch;
    //クリックされてるnodeのbranchが統合済みか
    let isBranchFinished = false;
    if(branchId != 0){
      isBranchFinished = 
        branches[nodes[clickedNodeId].branch].arrowNodeId != -1
        && branches[nodes[clickedNodeId].branch].endPointNodeId != -1;
    }

    //leftをクリックできるようにするか
    if(branchId == 0 || isBranchFinished){
      isBtnsDisabledNext['left'] = true;
    } else{
      isBtnsDisabledNext['left'] = false;
    }

    setIsBtnsDisabled(isBtnsDisabledNext);
  }
}

export default CtrlBtns
