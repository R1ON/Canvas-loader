import React, { PureComponent, createRef } from 'react';
// import PropTypes from 'prop-types';

class PageContainer extends PureComponent {
  constructor() {
    super();

    this.canvas = createRef();
  }

  componentDidMount() {
    const { current } = this.canvas;
    const { innerWidth, innerHeight } = window;

    this.ctx = current.getContext('2d');
    this.ctx.fillStyle = '#0d380d';
    this.ctx.fillRect(0, 0, innerWidth, innerHeight);
    this.ctx.save();
  }

  render() {
    return (
      <div className="page">
        {/*<header className="page__header">Liquid Cat</header>*/}
        <main className="page__main">
          <canvas ref={this.canvas} />
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
