import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useAppStore } from '@/store';
import './app.scss';

function App(props) {
  const initData = useAppStore((state) => state.initData);

  useEffect(() => {
    initData();
  }, [initData]);

  useDidShow(() => {});

  useDidHide(() => {});

  return props.children;
}

export default App;
