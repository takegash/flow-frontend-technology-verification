//辺
function Edge({edge, setSelectedEdge}){
  //edgeのあるべき場所の周囲5づつ大きく範囲をとる
  let width = Math.abs(edge.x2-edge.x1)+10,
    height = Math.abs(edge.y2-edge.y1)+10;
  //負の方向に線を引けないため、必ず小さいほうから線を引く
  let top = Math.min(edge.y1, edge.y2),
    left = Math.min(edge.x1, edge.x2);

  return(
    <>
      <svg 
        onClick={()=>setSelectedEdge(edge.id)}
        style={{
          position: 'absolute', 
          top: top, 
          left: left,
          zIndex: -1
        }}
        width={width} 
        height={height} 
        viewBox={"0 0 "+width+" "+height}>
        {/* 直線: <line x1 y1 x2 y2 /> */}
        <line 
          x1={5} y1={5} 
          x2={width-5} y2={height-5} 
          stroke="black" 
          strokeWidth="5" 
        />
      </svg>
    </>
  )
}

export default Edge
