import React from 'react';

const Header: React.FC = () => {
  return (
    <header>
      <h1>My Application</h1>
      <nav>
        <ul style={{ display: 'flex', listStyle: 'none', padding: 0 }}>
          <li style={{ marginRight: '1rem' }}><a href="/">Home</a></li>
          <li style={{ marginRight: '1rem' }}><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
