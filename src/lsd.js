const elems = document.querySelectorAll("a,p,span,div,section");
let frame = 0;
function animate() {
  for (let i = 0; i < elems.length; i++) {
    const scale = 1 + Math.abs(0.01 * Math.sin((frame + i) / 100));
    elems[i].style.filter = `hue-rotate(${frame + i}deg)`;
    elems[i].style.transform = `scale(${scale})`;
  }
  document.title = [...document.title].reverse().join("");
  frame++;
  setTimeout(() => {
    requestAnimationFrame(animate);
  }, 40);
}
animate();
