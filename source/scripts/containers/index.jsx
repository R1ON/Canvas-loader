import React, { PureComponent, createRef } from 'react';
// import PropTypes from 'prop-types';

import { throttle } from 'common/utils/lodash';

class PageContainer extends PureComponent {
  constructor() {
    super();

    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      radius: 100,
      offset: 0.1, // TODO: менять оффсет,
      // radius: Math.sqrt((window.innerWidth ** 2) + (window.innerHeight ** 2)) / 2,
    };

    this.canvas = createRef();

    const drawCanvasWithThrottle = throttle(this.drawCanvas, 300);

    // TODO завершить предыдущий рендер и начать этот с той позиции
    window.onresize = () => drawCanvasWithThrottle();
  }

  componentDidMount() {
    const { current } = this.canvas;

    this.ctx = current.getContext('2d');
    this.drawCanvas();
  }

  drawCanvas = () => {
    const { innerWidth, innerHeight } = window;

    this.setState({ width: innerWidth, height: innerHeight });

    requestAnimationFrame(this.drawArc);
  };

  clearCanvas = (width, height) => {
    this.ctx.clearRect(0, 0, width, height);
    // this.ctx.rotate(Math.PI / 180);
  };

  drawArc = () => {
    const { width, height, radius, offset } = this.state;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.clearCanvas(width, height);

    // TODO перенести этот транслейт, чтобы все было по центру и имело сглаживание
    this.ctx.translate(width / 2, height / 2);

    const drawPart = (startAngle, endAngle) => {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, startAngle, endAngle);
      this.ctx.lineWidth = 10;
      this.ctx.lineCap = 'round';
      this.ctx.strokeStyle = '#000066';
      this.ctx.stroke();
    };


    drawPart(offset, Math.PI / 2 - offset);
    drawPart(Math.PI / 2 + offset, Math.PI - offset);
    drawPart(Math.PI + offset, Math.PI + Math.PI / 2 - offset);
    drawPart(Math.PI + Math.PI / 2 + offset, Math.PI * 2 - offset);

    requestAnimationFrame(this.drawArc);
  };

  render() {
    const { width, height } = this.state;

    return (
      <div className="page">
        <main className="page__main">
          <canvas ref={this.canvas} width={width} height={height} />
        </main>
      </div>
    );
  }
}

// PageContainer.propTypes = {
//   getWeatherDataByCity: PropTypes.func.isRequired,
//   weatherInfo: PropTypes.object.isRequired,
// };

export default PageContainer;
