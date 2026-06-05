import {useEffect, useState, useRef, createContext, useContext} from 'react';

const WebSocketContext = createContext(null);

export function WebSocketProvider({nodeNum, setNodes, branchNum, setBranches, children}){
    //受信したメッセージ
    const [messages, setMessages] = useState([]);
    //WebSocketの参照
    const wsRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket('wss://flow-backend-w8q7.onrender.com/websocket/board');
        wsRef.current = ws;

        //メッセージ受信時
        ws.onmessage = (event) => {
            UpdateDatas(event.data);
        }

        return () => {
            ws.close();
        }
    }, []);

    return (
        <WebSocketContext.Provider value={{sendBoardDatas, messages}}>
            {children}
        </WebSocketContext.Provider>
    );

    //nodesやbranchesを更新する
    function UpdateDatas(message){
        console.log(message);
        let persedMsg = JSON.parse(message);
        setMessages(persedMsg);

        if(CheckDatas(persedMsg)){
            nodeNum.current = persedMsg.nodeNum;
            setNodes(persedMsg.nodes);
            branchNum.current = persedMsg.branchNum;
            setBranches(persedMsg.branches);
        }
    }

    //dataの形式チェック
    function CheckDatas(data){
        let isOk = ("nodeNum" in data) 
            && ("nodes" in data) 
            && ("branchNum" in data) 
            && ("branches" in data);
        
        return isOk;
    }

    //バックエンドに引数messageの情報を送る
    function sendMessage(message) {
        if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
            wsRef.current.send(message);
        }
    };

    //バックエンドにフローチャートの情報を送る
    function sendBoardDatas(nodeNum, nodes, branchNum, branches){
        const sendData = {
            nodeNum: nodeNum.current, 
            nodes: nodes,
            branchNum: branchNum.current, 
            branches: branches
        }
        let jsonData = JSON.stringify(sendData);
        sendMessage(jsonData);
    }
}

export function useWebSocket(){
    return useContext(WebSocketContext);
}

export default WebSocket;