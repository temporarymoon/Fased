import { html, render } from "lit-html";
const template = (data, name = "Score") => html `<div id="score">${name}:${data}</div>`;
const container = document.getElementById("scoreHolder");
console.log(container);
const display = (score, hp) => {
    render(html `
            ${template(score.toFixed(2))}
            ${template(hp.toFixed(2), "Hp")}
        `, container);
};
export { display, template, container };