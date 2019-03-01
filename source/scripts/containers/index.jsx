import React, { PureComponent, createRef } from 'react';
// import PropTypes from 'prop-types';

class PageContainer extends PureComponent {
  constructor() {
    super();

    this.canvas = createRef();
  }

  componentDidMount() {
    const { current } = this.canvas;

    const context = current.getContext('2d');
    context.fillStyle = '#f00';
    context.fillRect(0, 0, 300, 300);
    context.save();
  }

  render() {
    return (
      <div className="page">
        <header className="page__header">Liquid Cat</header>
        <main className="page__main">
          <canvas ref={this.canvas} width={300} height={300} />
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
