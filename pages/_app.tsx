import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import 'tailwindcss/tailwind.css';

const MyApp = ({ Component, pageProps }) => {

  return (
    <div className={`dark min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
      <Header />

      <Component {...pageProps} />
    </div>
  );
};

export default MyApp;
