import React, { PureComponent, createRef } from 'react';
// import PropTypes from 'prop-types';

import { throttle } from 'common/utils/lodash';

const DEFAULT_ROTATE_VALUE = Math.PI / 100;

class PageContainer extends PureComponent {
  constructor() {
    super();

    this.state = {
      cancelAnimationFrame: false,
      animationId: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      // radius: 100,
      offset: 0.1,
      radius: Math.sqrt((window.innerWidth ** 2) + (window.innerHeight ** 2)) / 2,
      rotateValue: 0,
    };

    this.canvas = createRef();

    const drawCanvasWithThrottle = throttle(this.redrawCanvas, 300);

    window.onresize = () => drawCanvasWithThrottle();
  }

  componentDidMount() {
    const { current } = this.canvas;

    this.ctx = current.getContext('2d');
    this.drawCanvas();
  }

  redrawCanvas = () => {
    const { animationId } = this.state;

    cancelAnimationFrame(animationId);
    this.setState({ cancelAnimationFrame: true });
    this.drawCanvas();
  };

  drawCanvas = () => {
    const { innerWidth, innerHeight } = window;

    this.setState({ width: innerWidth, height: innerHeight });
    requestAnimationFrame(this.drawArc);
  };

  clearCanvas = () => {
    const { width, height } = this.state;

    this.ctx.clearRect(0, 0, width, height);
  };

  rotateCanvas = () => {
    const {
      width, height, rotateValue, cancelAnimationFrame,
    } = this.state;

    this.ctx.translate(width / 2, height / 2);

    this.ctx.clearRect(-width, -height, width * 2, height * 2);

    if (cancelAnimationFrame) {
      this.ctx.rotate(rotateValue);
    } else {
      this.ctx.rotate(DEFAULT_ROTATE_VALUE);
    }

    this.ctx.translate(-width / 2, -height / 2);

    this.setState(prevState => ({
      cancelAnimationFrame: false,
      rotateValue: prevState.rotateValue + DEFAULT_ROTATE_VALUE,
      radius: prevState.radius - 5 - (prevState.radius * 0.05),
    }));
  };

  drawPart = (startAngle, endAngle) => {
    const { width, height, radius } = this.state;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    this.ctx.beginPath();
    this.ctx.arc(halfWidth, halfHeight, radius, startAngle, endAngle);
    this.ctx.lineWidth = 30;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#000066';
    this.ctx.stroke();
  };

  drawArc = () => {
    const {
      width, height, offset, radius,
    } = this.state;

    this.clearCanvas();
    this.rotateCanvas(width, height);

    this.drawPart(offset, Math.PI / 2 - offset);
    this.drawPart(Math.PI / 2 + offset, Math.PI - offset);
    this.drawPart(Math.PI + offset, Math.PI + Math.PI / 2 - offset);
    this.drawPart(Math.PI + Math.PI / 2 + offset, Math.PI * 2 - offset);

    const animationId = requestAnimationFrame(this.drawArc);

    if (radius <= 20) {
      cancelAnimationFrame(animationId);
    }

    this.setState({ animationId });
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
