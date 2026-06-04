//shape選択パレットの要素
function NodePalletItem({shape, drawShape, setDrawShape}){
  //console.log(setDrawShape);
  let color = (drawShape == shape.name) ? '#00AACC' : '#FFFFFF';
  //console.log(color);
  return(
    <li 
      style={{
        backgroundColor: color,
        padding: '2%',
        margin: '1%'
      }}
    >
      <img 
        src={shape.img} 
        onClick={onPalletItemClick}
        style={{
          height: '90%',
          width: '90%',
        }} 
      />
    </li>
  )

  function onPalletItemClick(){
    setDrawShape(shape.name);
  }
}

export default NodePalletItem
