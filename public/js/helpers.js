document.addEventListener("DOMContentLoaded", () => {

    const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll(".navbar-burger"), 0);
    if (navbarBurgers.length > 0) {
        navbarBurgers.forEach(elem => {
            elem.addEventListener("click", () => {
                const dataTarget = elem.dataset.target;
                const target = document.getElementById(dataTarget);
                elem.classList.toggle("is-active");
                target.classList.toggle("is-active");
            });
        });
    }
});

const hideReplies = postId => {
    document.querySelector(`#r_${postId}`).classList.toggle("is-hidden");
    const clickBox = document.querySelector(`#t_${postId}`);
    clickBox.textContent = clickBox.textContent === "[+] " ? "[-] " : "[+] ";
}