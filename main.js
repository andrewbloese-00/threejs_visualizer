import './style.css'
import { PerspectiveCamera , PlaneGeometry, CylinderGeometry, Scene, WebGLRenderer, Mesh, MeshBasicMaterial, DoubleSide, Vector3 } from "three"

const BASS_LOW_HZ = 20;
const BASS_HIGH_HZ = 250;
const TREBLE_LOW_HZ = 2000;
const TREBLE_HIGH_HZ = 20000;
const SPIN_SPEED = 2
const r = 50;
const camera = new PerspectiveCamera(65,window.innerWidth/window.innerHeight,0.1,1000)

//messy af need to come back and clean this shit up sometime
async function init(){
  let frame = 0;
  let columns = []
  let colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]

  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  let frequencyData = new Uint8Array(analyser.frequencyBinCount)
  const scene = new Scene()
  const renderer = new WebGLRenderer()
  document.body.appendChild(renderer.domElement)
  function onResize(){
    renderer.setSize(window.innerWidth,window.innerHeight,true)
    camera.updateProjectionMatrix();
  }

  camera.position.set(40,30,0)
  // camera.position.set(100,150,100)
  camera.lookAt(new Vector3(0,30,0))
  window.addEventListener("resize",onResize)
  onResize()
  const { stream , error } = await getMicrophoneStream()
  if(error) return 
  const audioSource = audioContext.createMediaStreamSource(stream)
  audioSource.connect(analyser)

  buildColumns()
  animate()

  function hzToFrequencyBin(lowHz, highHz){
    const div = audioContext.sampleRate/analyser.fftSize
    return { 
      start: Math.floor(lowHz/div),
      end: Math.ceil(highHz/div)
    }
  }

  /**
   * @about calculates the average bass/treble volume, as well as the bin and volume of the loudest bass and treble frequencies
   * @returns {{avgs: {bass:number, treble:number}, maxBass:number, maxTreble:number}}
   */
  function getBassAndTrebleStats() {
    const bassBounds = hzToFrequencyBin(BASS_LOW_HZ,BASS_HIGH_HZ)
    const trebleBounds = hzToFrequencyBin(TREBLE_LOW_HZ,TREBLE_LOW_HZ);
    let sumTreble = 0, sumBass = 0, maxBass = {idx:0,val:0}, maxTreble = {idx:0,val:0};
    for(let b = bassBounds.start; b <= bassBounds.end; b++){
        sumBass += frequencyData[b]
        if(frequencyData[b] > maxBass.val) {
            maxBass.val = frequencyData[b]
            maxBass.idx = b
        }
    }
    for(let t = trebleBounds.start; t <= trebleBounds.end; t++){
        sumTreble += frequencyData[t]
        if(frequencyData[t] > maxTreble.val) {
            maxTreble.val = frequencyData[t]
            maxTreble.idx = t; 
        }
    }

    const avgBass = sumBass / (bassBounds.end -bassBounds.start);
    const avgTreble = sumTreble / (trebleBounds.end - trebleBounds.start);
    return { 
      avgs: { bass: avgBass , treble: avgTreble},
      maxBass,
      maxTreble,
    }
  }

  //build the columns each at a distance of  "r" from the origin
  function buildColumns(){
    //iterate through each of the frequency bins
    for(let i = 0; i <= frequencyData.length; i++){
      //calculate the appropriate color based on the bin we are currently building
      let binColor = Math.floor(i / frequencyData.length * (colors.length-1))
      let column = new Mesh(
        new CylinderGeometry(1,5,1),
        new MeshBasicMaterial({
          color: colors[binColor],
          wireframe: true,
          side: DoubleSide
        })
      )
      //position the column
      let theta = i/frequencyData.length * 2*Math.PI 
      let rad = frequencyData[i]
      let z = rad * Math.sin(theta)
      let x = rad * Math.cos(theta)

      column.position.set(x,0,z)
      //store column for easy access in "animate" function
      columns[i] = column
      //add the column to the scene
      scene.add(columns[i])
      //initial render
      renderer.render(scene,camera)

    }

  }

  function animate(){
    frame+=SPIN_SPEED;
    analyser.getByteFrequencyData(frequencyData);

    // const stats = getBassAndTrebleStats();
    //TODO  add another shape that changes based on average bass / treb using 'stats'

    //reposition and scale according to volume at current frequency bin
    for(let i = 0; i < frequencyData.length; i++){
      let theta = i+frame/frequencyData.length * 2*Math.PI
      let z = r * Math.sin(theta)
      let x = r * Math.cos(theta)

      columns[i].position.set(x,0,z)
      columns[i].position.y += frequencyData[i]/255*100/2
      columns[i].scale.y = frequencyData[i]/255*80
    }
    renderer.render(scene,camera)
    setTimeout(()=>{
      requestAnimationFrame(animate)
    },60/1000)

  }

  return {camera}

}

/**
 * @about attempts to grab microphone stream from user, requests permission. returns the stream or an error object
 * @returns {Promise<{error?:any, stream?:MediaStream}>}
 */
async function getMicrophoneStream(){
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:false})
    return { stream }
  } catch (error) {
    console.error(error)
    return { error }
  }
}


window.addEventListener("DOMContentLoaded",()=>{
  const activator = document.querySelector("#startBtn")
  const perspectiveButton = document.querySelector("#perspectiveButton")
  //perspective can be 1 or 0
  let perspective = false
  
  activator.addEventListener("click",async ()=>{
    const {camera} = await init(); 
    activator.remove()
    
    perspectiveButton.addEventListener("click",(e)=>{
      if(perspective){
        camera.position.set(40,30,0);
        camera.lookAt(0,30,0)
      } else { 
        camera.position.set(100,150,100)
        camera.lookAt(0,50,0)  
      }
      perspective = !perspective
    })
    window.addEventListener("keypress",e=>{
      if(e.key === "v" || e.key === "V"){
        perspectiveButton.click()
      }
    })
  })

})
