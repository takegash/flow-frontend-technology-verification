import {useEffect, useState} from 'react'
import { NODE_SHAPES } from '../constraints'
import Spacer from './Spacer'
import CtrlBtns from './CtrlBtns'
import Node from './Node'
import Edge from './Edge'
import { useWebSocket } from './WebSocket'

//フローチャートを書く部分。下部に操作ボタン
function Board({
  nodes, 
  setNodes, 
  branches, 
  setBranches, 
  nodeNum, 
  branchNum, 
  boardRef, 
  drawShape, 
  clickedNodeId, 
  setClickedNodeId}){

  let edges={};  //並行する処理の位置を管理する配列
  let dfsPassedBranchEndNode=[];  //dfsの際、統合部で片割れを既に通過したか判断するための配列

  //WebSocketの参照
  const {sendBoardDatas, messages} = useWebSocket();
  //選択されたedgeを保持
  let [selectedEdge, setSelectedEdge] = useState(null);
  //edge選択待ち状態かを保持
  let [isWaitingSelectEdge, setIsWaitingSelectEdge] = useState(false);
  //分岐の統合の際、接続元nodeの情報を保持
  let [waitingConnectNodeId, setWaitingConnectNodeId] = useState(0);
  //console.log("wait:"+waitingConnectNodeId);

  
  //let [edgeNum, setEdgeNum] = useState(0);
  let edgeNum = 0; //edgeの数(兼edgeのid)
  //node間の距離
  let distance = {x: 300, y: 100};
  //最も下のnodeのy座標
  let maxY = 0;
  
  

  useEffect(() => {
    // コンポーネント生成時（マウント時）に実行したい処理
    console.log('Component mounted');
    //console.log(boardRef.current);
    //console.log(messages);
    if(messages == null || messages.length === 0){
      //1つ目のnodeの初期化
      let rect = boardRef.current.getBoundingClientRect();
      //console.log(rect);
      console.log("messages is empty");
      let INIT_X = rect.x, INIT_Y = rect.y + 50;
      nodes[0].x = INIT_X;
      nodes[0].y = INIT_Y;
      nodes[0].branch = 0;
    }

    setNodes({...nodes});

    // クリーンアップ処理（アンマウント時に実行）
    return () => {
      console.log('Component unmounted');
    };
  }, []); // 空配列が重要

  useEffect(()=>{
    //接続先edgeを選択する状態になる前、選択する前は早期return
    if(!isWaitingSelectEdge || selectedEdge == null){
      return;
    }

    //edgeを選択後、選択されたedgeが元の枝のものだったら接続
    let edgeFromNodeId = edges[selectedEdge].from,
      branchId = nodes[waitingConnectNodeId].branch;
    //console.log(nodes[waitingConnectNodeId]);

    if(nodes[edgeFromNodeId].branch == branches[branchId].sourceBranchId){
      ReconnectOtherBranchNode(edgeFromNodeId, waitingConnectNodeId);
      //console.log("edge: "+selectedEdge);
      sendBoardDatas(nodeNum, nodes, branchNum, branches);
      setIsWaitingSelectEdge(false);
    }
  }, [selectedEdge]);
  
    
    /*
    * TODO: node, edgeの構造を分析(branch番号を振る)してから
    * 詳細な位置を決める
    * yのみdistance定義しておいて、xはブランチの位置を出した後で変更？
    */
  if(nodeNum.current != 0){
    //位置を計算(仮)
    edges = {};
    dfsPassedBranchEndNode = [];
    console.log("dfs start");
    CalcFlowObjsPosByDfs(nodes[0]);
    CalcEdgesPos();
  }
    
  console.log(nodes);
  
  return (
    <>
      {DrawBoards()}
      <Spacer y={maxY}/>
      <div className='fixed-bottom'>
        <CtrlBtns 
          nodes={nodes}
          branches={branches}
          nodeNum={nodeNum}
          branchNum={branchNum}
          clickedNodeId={clickedNodeId} 
          drawShape={drawShape} 
          CreateNode={CreateNode} 
          AddFork={AddFork}
          InsertChildNodeDown={InsertChildNodeDown}
          DeleteNode={DeleteNode}
          WaitSelectEdge={WaitSelectEdge}
        />
      </div>
    </>
  )

  //nodeを生成
  function CreateNode(shape){
    let newNode = {
      id: nodeNum.current, 
      shape: shape, 
      text: "", 
      x:0, 
      y:0, 
      width: 220,
      height: 70,
      branch: 0, 
      nexts: {}, 
      prevs: {},
      disabledBtnDirections: [...NODE_SHAPES[shape].disabledBtnDirections],
      ynInvert: false
    }
    if(shape == NODE_SHAPES.decideInvert.name){
      newNode.shape = NODE_SHAPES.decide.name;
      newNode.ynInvert = true;
    }

    nodes[nodeNum.current] = newNode;
    setNodes({...nodes});
    nodeNum.current++;
    //setNodeNum(nodeNum);

    return newNode.id;
  }

  //nodeをparentIdのnodeの下に挿入
  function InsertChildNodeDown(insertNodeId, parentId){
    let insertNode = nodes[insertNodeId], 
      parentNode = nodes[parentId],
      nextDownNode = null;
    
    //parentが下にnodeを持っているか先に調査
    Object.entries(parentNode.nexts).map(([key, value])=>{
      if(value.direction == 'down'){
        nextDownNode = nodes[key];
      }
    });

    
    //新たなnodeをparentに接続
    parentNode.nexts[insertNodeId] = {direction: 'down'};
    insertNode.prevs[parentId] = {direction: 'up'};
    insertNode.branch = parentNode.branch;

    //もしparentがすでに下にnodeを持っていたらそのnodeと新たなnodeに接続を付け替え
    if(nextDownNode){
      insertNode.nexts[nextDownNode.id] = {direction: 'down'};
      nextDownNode.prevs[insertNodeId] = {direction: 'up'};
      delete parentNode.nexts[nextDownNode.id];
      delete nextDownNode.prevs[parentId];
    }
  }

  //分岐を作成する
  function AddFork(addNodeId, parentId){
    //console.log(nodes);
    let addNode = nodes[addNodeId],
      parentNode = nodes[parentId];

    //pointをつける
    let pointId = CreateNode(NODE_SHAPES.point.name),
      pointNode = nodes[pointId];
      
    parentNode.nexts[pointId] = {direction: 'right'};
    pointNode.prevs[parentId] = {direction: 'left'};
    let newBranchId = CreateBranch(parentNode.branch);
    pointNode.branch = newBranchId;
    
    //nodeを追加
    //新たなnodeをparentに接続
    InsertChildNodeDown(addNodeId, pointId);
    //console.log(addNodeId, parentId, pointId);
  }

  //nodeを削除
  function DeleteNode(nodeId){
    //開始nodeは消せない
    if(nodeId == 0){
      return;
    }
    

    switch(nodes[nodeId].shape){
    //pointのnodeの場合
    case NODE_SHAPES.point.name:
      //何もしない
      break;

    //decideのnodeの場合
    case NODE_SHAPES.decide.name:
      DeleteDecideNode(nodeId);
      break;

    //arrowのnodeの場合
    case NODE_SHAPES.arrow.name:
      DeleteArrowNode(nodeId);
      break;

    //そのほかのnodeの場合
    default:
      DeleteNodeAndConnectUpToDown(nodeId);
      break;
    }

    setNodes({...nodes});
    sendBoardDatas(nodeNum, nodes, branchNum, branches);
    clickedNodeId = null;
    setClickedNodeId(clickedNodeId);
  }

  //指定したnodeを削除して、上下をつなげる
  function DeleteNodeAndConnectUpToDown(nodeId){
    //上を取得
    let nowNode = nodes[nodeId], prevId = -1, nextId = -1;
    console.log(nowNode.prevs);
    Object.entries(nowNode.prevs).map(([key, value])=>{
      if(value.direction == "up"){
        prevId = key;
      }
    });
    //下を取得
    Object.entries(nowNode.nexts).map(([key, value])=>{
      if(value.direction == "down"){
        nextId = key;
      }
    });
    console.log(prevId+" "+nextId);

    //上があれば
    if(prevId != -1){
      //削除対象のnodeの接続情報を削除
      delete nodes[prevId].nexts[nodeId];
    }
    //下があれば
    if(nextId != -1){
      //削除対象nodeの接続情報を削除
      delete nodes[nextId].prevs[nodeId];
    }

    if(prevId != -1 && nextId != -1){
      //上下のnodeを接続
      nodes[prevId].nexts[nextId] = {direction: "down"};
      nodes[nextId].prevs[prevId] = {direction: "up"};
    }
    
    //削除対象nodeを削除
    delete nodes[nodeId];
  }

  //arrow(分岐の結合部)を削除したとき
  function DeleteArrowNode(arrowId){
    //arrowNode, その前のpoint, その前のnodeを取得
    let arrowNode = nodes[arrowId], 
      pointId = -1, 
      bottomId = -1;

    //pointを取得
    Object.entries(arrowNode.prevs).map(([key, value]) =>{
      if(value.direction == "right"){
        pointId = key;
      }
    });
    //pointがなければreturn
    if(pointId == -1){
      console.log("pointId not found");
      return;
    }

    //分岐先branchの末尾node(pointの前)を取得
    Object.entries(nodes[pointId].prevs).map(([key, value]) =>{
      if(value.direction == "up"){
        bottomId = key;
      }
    });

    //2つのnodeは削除、末尾nodeは下の接続を削除
    DeleteNodeAndConnectUpToDown(arrowId);
    delete nodes[pointId];
    delete nodes[bottomId].nexts[pointId];

    //branchの情報を更新
    branches[nodes[bottomId].branch].endPointNodeId = -1;
    branches[nodes[bottomId].branch].arrowNodeId = -1;
  }

  //decide(分岐の開始部)を削除したとき
  //元branchに戻るか、子nodeがない・既に消えたになるまで消す
  //分岐先のbranchのデータも消す。
  //分岐に当たったらこの関数を呼ぶ
  function DeleteDecideNode(decideId){
    let decideNode = nodes[decideId],
      nowNodeId = -1, //分岐先のnodeのId
      branchId = -1; //分岐先のbranchのId
    
    Object.entries(decideNode.nexts).map(([key, value]) =>{
      if(value.direction == "right"){
        nowNodeId = key;
        branchId = nodes[nowNodeId].branch;
      }
    });

    //引数のdecideのnodeを削除
    DeleteNodeAndConnectUpToDown(decideId);
    
    //分岐後のnodeを全消去
    while(nowNodeId != -1){
      let downNodeId = -1;
      Object.entries(nodes[nowNodeId].nexts).map(([key, value]) =>{
        if(value.direction == "down"){
          downNodeId = key;
        }
      });
      //decideのnodeの削除はその分岐先があるため別
      if(nodes[nowNodeId].shape == NODE_SHAPES.decide.name){
        console.log("nowNode:"+nowNodeId);
        DeleteDecideNode(nowNodeId);
      } else {
        DeleteNodeAndConnectUpToDown(nowNodeId);
      }
      nowNodeId = downNodeId;
    }

    //decideから分岐があれば
    if(branchId != -1){
      //分岐が結合されていれば
      if(branches[branchId].arrowNodeId != -1){
        DeleteNodeAndConnectUpToDown(branches[branchId].arrowNodeId);
      }
      
      delete branches[branchId];
    }
  }

  //edgeを生成
  function CreateEdge(){
    let newEdge = {
      id: edgeNum,
      from: -1,
      to: -1,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0
    };

    edges[edgeNum] = newEdge;
    edgeNum++;
    //setEdgeNum(edgeNum);

    return newEdge.id;
  }

  //branchを生成
  function CreateBranch(sourceBranchId){
    let newBranch = {
      id: branchNum.current,
      maxWidth: 300,
      sourceBranchId: sourceBranchId,
      endPointNodeId: -1,
      arrowNodeId: -1
    };

    branches[branchNum.current] = newBranch;
    setBranches({...branches});
    console.log(branches);
    branchNum.current++;
    //setBranchNum(branchNum);

    return newBranch.id;
  }

  //edgeの接続元、接続先を設定
  function SetEdgeDirection(edgeId, from, to){
    let edge = edges[edgeId];
    edge.from = from;
    edge.to = to;
  }

  //edge選択待ち状態に入る
  function WaitSelectEdge(){
    setSelectedEdge(null);
    setIsWaitingSelectEdge(true);
    setWaitingConnectNodeId(clickedNodeId);
    console.log("waiting");
  }

  //引数のnode2つの位置の真下で、分岐されていたものを統合する
  function ReconnectOtherBranchNode(arrowNodeParentId, endNodeParentId){
    //接続点のノードを生成
    let arrowNodeId = CreateNode(NODE_SHAPES.arrow.name),
      endNodeId = CreateNode(NODE_SHAPES.point.name);
    
    InsertChildNodeDown(endNodeId, endNodeParentId);
    InsertChildNodeDown(arrowNodeId, arrowNodeParentId);

    //接続点のノードを接続
    nodes[endNodeId].nexts[arrowNodeId] = {direction: 'left'};
    nodes[arrowNodeId].prevs[endNodeId] = {direction: 'right'};

    //branchの終点情報を更新
    let branchId = nodes[endNodeParentId].branch;
    branches[branchId].endPointNodeId = endNodeId;
    branches[branchId].arrowNodeId = arrowNodeId;

    setNodes({...nodes});
    setBranches({...branches});
  }


  //フローチャート要素の位置を計算
  function CalcFlowObjsPosByDfs(nowNode){
    //console.log(nowNode.shape);
    let branchEndPartnerNodeId = null;
    if(nowNode.shape == NODE_SHAPES.point.name){
      //下に子を持っているか？
      let hasDown = false;
      Object.values(nowNode.nexts).map((next)=>{
        if(next.direction == 'down'){
          hasDown = true;
        }
      });

      //下に子を持っていなければbranchの終点
      if(!hasDown){
        //nowNodeに対応するarrowをパートナーとして保持
        console.log(branches);
        branchEndPartnerNodeId = branches[nowNode.branch].arrowNodeId;
      }
    }
    if(nowNode.shape == NODE_SHAPES.arrow.name){
      //nowNodeに繋ごうとしている右のnodeを取得
      let rightNodeId = null;
      Object.entries(nowNode.prevs).map(([key, prev])=>{
        if(prev.direction == 'right'){
          rightNodeId = key;
        }
      })
      
      if(rightNodeId == null){
        console.log("arrow is not connected from right point");
        return;
      }

      //nowNodeに対応するendPointをパートナーとして保持
      branchEndPartnerNodeId = rightNodeId;
    }

    //対応するnodeが既に探索されていたらyを揃えてnode間に線を引いてそのまま探索続行
    if(branchEndPartnerNodeId != null){
      dfsPassedBranchEndNode.push(nowNode.id);
      console.log(dfsPassedBranchEndNode[1] + " " + branchEndPartnerNodeId);
      //console.log(dfsStoppedNode[0] == branchEndPartnerNodeId);
      //console.log(dfsStoppedNode.find((x)=>x == branchEndPartnerNodeId));
      if(dfsPassedBranchEndNode.find((x) => x == branchEndPartnerNodeId) != undefined){
        AlighNodeYLarger(nowNode.id, branchEndPartnerNodeId);
        let endPartnerEdgeId = CreateEdge();
        SetEdgeDirection(endPartnerEdgeId, nowNode.id, branchEndPartnerNodeId);
      } 
      //対応するnodeがまだ探索されていなければ待つ
      else {
        console.log("returnしてるよ");
        //console.log(dfsPassedBranchEndNode.length);
        return;
      }
    }
    //console.log(nowNode.id);
    //console.log("y"+nowNode.y);
    //console.log(nowNode.nexts);

    //すべての子ノードに対して座標、辺の更新処理を行い、再帰
    Object.entries(nowNode.nexts).map(([key, value]) =>{
      let nextId = key, 
        nextDirection = value.direction,
        nextNode = nodes[nextId];

      //座標の更新
      //console.log("next: "+nextId);
      //console.log("nowid: "+nowNode.id);

      //console.log(nodes);
      //console.log("next:"+nextNode.y);

      switch(nextDirection){
        case 'up':
          nextNode.x = nowNode.x
          nextNode.y = nowNode.y - distance.y;
          break;
        case 'down':
          nextNode.x = nowNode.x;
          nextNode.y = nowNode.y + distance.y;
          break;
        case 'right':
          nextNode.x = nowNode.x + distance.x;
          nextNode.y = nowNode.y;
          break;
        case 'left':
          break;
      }
      //console.log(nowNode.y+" "+nextNode.y);
      //辺を生成・配置
      let newEdgeId = CreateEdge();
      SetEdgeDirection(newEdgeId, nowNode.id, nextNode.id);
      //maxYを更新
      maxY = Math.max(maxY, nowNode.y);
      //再帰
      CalcFlowObjsPosByDfs(nextNode);
    })
  }

  //与えた2つのnodeのy座標を大きいほうに合わせる
  function AlighNodeYLarger(AnodeId, BnodeId){
    let aNode = nodes[AnodeId], bNode = nodes[BnodeId],
      aY = aNode.y, bY = bNode.y;
    let biggerY = Math.max(aY, bY);
    aNode.y = biggerY;
    bNode.y = biggerY;
    console.log(Math.max(aY, bY));
  }

  //辺の位置を算出
  function CalcEdgesPos(){
    Object.values(edges).map((edge)=>{
      let fromNode = nodes[edge.from],
        toNode = nodes[edge.to];
      
      edge.x1 = fromNode.x+fromNode.width/2-5;
      edge.y1 = fromNode.y+fromNode.height/2-5;
      edge.x2 = toNode.x+toNode.width/2-5;
      edge.y2 = toNode.y+toNode.height/2-5;
    });
  }

  //フローチャート全体を配置
  function DrawBoards(){
    /* mapを使ってnodesからフローチャートを出力 */
    //座標はnodes内の値に従う
    return(
      <div >
        {DrawNodes()}
        {DrawEdges()}
      </div>
    )
  }

  //nodeを配置
  function DrawNodes(){
    return(
      <>
        {Object.values(nodes).map(
          (node) =>{
            return (
              <Node 
                key={node.id} 
                node={node} 
                clickedNodeId={clickedNodeId}
                setClickedNodeId={setClickedNodeId}
                sendBoardDatasEvent={()=>{sendBoardDatas(nodeNum, nodes, branchNum, branches);}}
              />
          )}
        )}
      </>
    )
  }

  //辺を配置
  function DrawEdges(){
    return(
      <>
        
          {Object.values(edges).map((edge, index)=>{
            return(
              <Edge
                key={index}
                edge={edge}
                setSelectedEdge={setSelectedEdge}
              />
            );
          })}
      </>
    );
  }
}

export default Board
