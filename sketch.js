let particles = [];
let missiles = [];
let explosions = [];
let stars = [];
const colors = ['#f6bd60', '#f7ede2', '#f5cac3', '#84a59d', '#f28482'];
let lastSpawnTime = 0;
let score = 0;

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 初始產生 10 個物件
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle());
  }
  lastSpawnTime = millis();

  // 初始產生 100 個背景裝飾星星
  for (let i = 0; i < 100; i++) {
    stars.push(new Star());
  }
}

function draw() {
  // 全螢幕背景為黑色
  background(0);

  // 繪製背景裝飾星星
  for (let s of stars) {
    s.update();
    s.display();
  }

  // 每隔 5 秒產生一個新物件
  if (millis() - lastSpawnTime > 5000) {
    particles.push(new Particle());
    lastSpawnTime = millis();
  }

  // 更新並顯示爆炸效果
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    explosions[i].display();
    if (explosions[i].isFinished()) {
      explosions.splice(i, 1);
    }
  }

  // 更新並顯示飛彈
  for (let i = missiles.length - 1; i >= 0; i--) {
    missiles[i].update();
    missiles[i].display();

    // 檢查飛彈是否擊中粒子
    for (let j = particles.length - 1; j >= 0; j--) {
      let d = dist(missiles[i].x, missiles[i].y, particles[j].x, particles[j].y);
      if (d < particles[j].size) {
        // 產生爆炸
        explosions.push(new Explosion(particles[j].x, particles[j].y, particles[j].color));
        // 移除物件
        particles.splice(j, 1);
        missiles.splice(i, 1);
        score += 10;
        break; // 飛彈已消失，跳出內層迴圈
      }
    }

    // 移除超出螢幕的飛彈
    if (missiles[i] && missiles[i].isOffScreen()) {
      missiles.splice(i, 1);
    }
  }

  // 更新並顯示粒子元件
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.display();
  }

  // 繪製中央指標 (箭頭)
  drawCenterUI();

  // 顯示分數
  fill(255);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  text('Score: ' + score, 20, 20);
}

function drawCenterUI() {
  push();
  translate(width / 2, height / 2);
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  rotate(angle);
  stroke(255);
  strokeWeight(3);
  line(0, 0, 40, 0);       // 箭頭身
  line(40, 0, 30, -10);    // 箭頭尖端
  line(40, 0, 30, 10);     // 箭頭尖端
  pop();
}

// 當視窗大小改變時，自動調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Particle {
  constructor() {
    this.size = random(50, 100);
    this.x = random(this.size, width - this.size);
    this.y = random(this.size, height - this.size);
    this.color = color(random(colors));
    // 設定不一樣的移動速度
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.isCircle = false;
  }

  update() {
    // 移動位置
    this.x += this.vx;
    this.y += this.vy;

    // 邊界反彈
    if (this.x < this.size || this.x > width - this.size) this.vx *= -1;
    if (this.y < this.size || this.y > height - this.size) this.vy *= -1;

    // 判斷滑鼠是否靠近物件 (距離小於物件大小的一半)
    let d = dist(mouseX, mouseY, this.x, this.y);
    this.isCircle = (d < this.size);
  }

  display() {
    push();
    translate(this.x, this.y);
    
    // 繪製主體外表
    fill(this.color);
    noStroke();
    
    if (this.isCircle) {
      // 滑鼠靠近時變圓圈
      ellipse(0, 0, this.size * 2);
    } else {
      // 星狀圓弧外表 (利用 beginShape 繪製波浪狀)
      beginShape();
      let points = 40;
      for (let i = 0; i < TWO_PI; i += TWO_PI / points) {
        // 使用 sin 函數讓半徑產生起伏，模擬星狀感
        let r = this.size + sin(i * 10) * (this.size * 0.08);
        let vx = cos(i) * r;
        let vy = sin(i) * r;
        vertex(vx, vy);
      }
      endShape(CLOSE);
    }

    // 繪製眼睛 (白色)
    let eyeDist = this.size * 0.35;
    let eyeSize = this.size * 0.25;
    this.drawEye(-eyeDist, -this.size * 0.2, eyeSize);
    this.drawEye(eyeDist, -this.size * 0.2, eyeSize);

    // 繪製笑嘴 (圓弧)
    noFill();
    stroke(0, 100); // 嘴巴顏色稍深
    strokeWeight(this.size * 0.05);
    arc(0, this.size * 0.1, this.size * 0.6, this.size * 0.4, 0, PI);

    pop();
  }

  /**
   * 繪製單個眼睛及其跟隨滑鼠的眼珠
   */
  drawEye(ox, oy, size) {
    // 眼白
    fill(255);
    noStroke();
    ellipse(ox, oy, size);

    // 計算眼珠方向
    let angle = atan2(mouseY - (this.y + oy), mouseX - (this.x + ox));
    
    // 限制眼珠移動範圍在眼白內
    let pupilOffset = size * 0.25;
    let px = ox + cos(angle) * pupilOffset;
    let py = oy + sin(angle) * pupilOffset;

    // 黑眼珠
    fill(0);
    ellipse(px, py, size * 0.5);
  }
}

/**
 * 背景裝飾星星類別
 */
class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(1, 3);
    this.angle = random(TWO_PI); // 用於閃爍效果的隨機相位
    this.blinkSpeed = random(0.02, 0.08); // 每個星星閃爍頻率不同
  }

  update() {
    this.angle += this.blinkSpeed;
  }

  display() {
    // 利用 sin 函數產生 50 到 255 之間的透明度變化，達到閃爍感
    let brightness = map(sin(this.angle), -1, 1, 50, 255);
    push();
    noStroke();
    fill(255, brightness);
    ellipse(this.x, this.y, this.size);
    pop();
  }
}

/**
 * 飛彈類別
 */
class Missile {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.speed = 7;
    this.vx = cos(angle) * this.speed;
    this.vy = sin(angle) * this.speed;
    this.angle = angle;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    stroke(255, 50, 50);
    strokeWeight(4);
    line(0, 0, 15, 0); // 簡約的飛彈線條
    pop();
  }

  isOffScreen() {
    return (this.x < 0 || this.x > width || this.y < 0 || this.y > height);
  }
}

/**
 * 爆炸效果類別
 */
class Explosion {
  constructor(x, y, col) {
    this.x = x;
    this.y = y;
    this.color = col;
    this.radius = 10;
    this.alpha = 255;
  }

  update() {
    this.radius += 4;   // 擴散速度
    this.alpha -= 10;   // 消失速度
  }

  display() {
    push();
    noFill();
    let c = color(this.color);
    c.setAlpha(this.alpha);
    stroke(c);
    strokeWeight(2);
    ellipse(this.x, this.y, this.radius);
    pop();
  }

  isFinished() {
    return this.alpha <= 0;
  }
}

// 監聽滑鼠點擊發射飛彈
function mousePressed() {
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  missiles.push(new Missile(width / 2, height / 2, angle));
}
