//画面下部のボタンと重ねないためのスペーサ
function Spacer({y}){
  let height = window.innerHeight;
  return(
    <>
      <div 
        style={{
          position: 'absolute',
          top: y,
          left: 50,
          height: height,
          width: 200,
          zIndex: -2
        }}
      ></div>
    </>
  )
}

export default Spacer
