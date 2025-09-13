import React from 'react';
import { Route, Switch } from 'wouter';
import MessagingPage from '@/pages/messaging';
import SettingsPage from '@/pages/settings';
import AboutPage from '@/pages/about';
import PrivateMessagesPage from '@/pages/private-messages';
import FellowsPage from '@/pages/fellows';
import SavedMessagesPage from '@/pages/saved-messages';
import NotFoundPage from '@/pages/not-found';

export default function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={MessagingPage} />
      <Route path="/messaging" component={MessagingPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/private-messages" component={PrivateMessagesPage} />
      <Route path="/fellows" component={FellowsPage} />
      <Route path="/saved-messages" component={SavedMessagesPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}