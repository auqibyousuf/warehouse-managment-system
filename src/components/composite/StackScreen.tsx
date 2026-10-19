import React from 'react';
import { router } from 'expo-router';
import { Header } from './Header';

export interface StackScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** Wrapper for screens opened from Manage: back arrow header, no tab bar. */
export const StackScreen: React.FC<StackScreenProps> = ({ title, subtitle, children }) => (
  <>
    <Header
      title={title}
      subtitle={subtitle}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
    />
    {children}
  </>
);

export default StackScreen;
