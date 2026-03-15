
const slides = document.querySelectorAll('.slide');
let index=0;

function show(){
slides.forEach(s=>s.classList.remove('active'));
slides[index].classList.add('active');
}

function next(){
index++;
if(index>=slides.length) index=0;
show();
}

show();
setInterval(next,5000);
