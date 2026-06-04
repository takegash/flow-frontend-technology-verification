import processImg from './assets/process.png'
import terminatorImg from './assets/terminator.png'
import decideImg from './assets/decide.png'
import decideInvertImg from './assets/decideInvert.png'
import dataImg from './assets/data.png'
import loopImg from './assets/loop.png'
import loopEndImg from './assets/loopEnd.png'
import arrowImg from './assets/arrow.png'
import pointImg from './assets/point.png'

//nodeの種類の一覧
/*
* key名: shapeの名前
* id: shapeごとのid
* name: keyと一致する名前
* img: 表示する画像への参照
* disabledBtnDirection: このshapeのnodeが選択された際、
*                       基本的にその方向の操作ボタンを無効にする
*/
export const NODE_SHAPES = {
  point: {id: 0, name: 'point', img: pointImg, disabledBtnDirections: ['up', 'down', 'right', 'left']}, 
  terminator: {id: 1, name: 'terminator', img: terminatorImg, disabledBtnDirections: ['right', 'left']}, 
  process: {id: 2, name: 'process', img: processImg, disabledBtnDirections: ['right', 'left']}, 
  decide: {id: 3, name: 'decide', img: decideImg, disabledBtnDirections: ['left']}, 
  decideInvert: {id: 4, name: 'decideInvert', img: decideInvertImg, disabledBtnDirections: ['left']},
  data: {id: 5, name: 'data', img: dataImg, disabledBtnDirections: ['right', 'left']}, 
  loop: {id: 6, name: 'loop', img: loopImg, disabledBtnDirections: ['right', 'left']}, 
  loopEnd: {id: 7, name: 'loopEnd', img: loopEndImg, disabledBtnDirections: ['right', 'left']}, 
  arrow: {id: 8, name: 'arrow', img: arrowImg, disabledBtnDirections: ['right', 'left']}
};