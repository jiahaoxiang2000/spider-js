import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 text-black dark:text-white p-4">
      <nav>
        <ul className="flex list-none p-0">
          <li className="mr-4"><a href="/">Home</a></li>
          <li className="mr-4"><a href="/about">About</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
