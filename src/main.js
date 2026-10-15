
import "./style.css";
import { BaseballGame } from "./core/Game.js";

const stadium = document.getElementById("stadium");

try {
  window.ieumBaseball = new BaseballGame();
} catch (error) {
  console.error("IEUM Baseball initialization failed:", error);

  stadium.innerHTML = `
    <div style="
      padding:30px;
      color:white;
      font-family:sans-serif;
      line-height:1.8
    ">
      <h2>3D 경기장을 불러오지 못했어.</h2>
      <p>브라우저의 WebGL 지원 여부와 인터넷 연결을 확인해 줘.</p>
      <p>오류: ${String(error.message || error)}</p>
    </div>
  `;
}
