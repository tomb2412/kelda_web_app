import { lazy, Suspense } from 'react';
import DepthGuage from "./components/depth";
import WindBarb from "./components/windGraphBarb";
import WindRose from "./components/wind_rose";
import PassagePlan from './components/passagePlan';
import GpsDisplay from "./components/gps";
import { SignedIn } from '@clerk/clerk-react';
import Chart from './components/map';
import { ErrorBoundary } from './components/ErrorBoundary';

const FloatingChat = lazy(() => import('./components/chatBot'));

function App() {
  return (
    <div className='dark:bg-slate-500 bg-white]'>
      <div className='px-3 md:px-5 py-8 gap-4'>
        <div className='flex flex-col sm:grid md:grid-cols-2 lg:grid-cols-3 gap-3'>
          <ErrorBoundary><GpsDisplay /></ErrorBoundary>
          <ErrorBoundary><WindRose /></ErrorBoundary>
          <ErrorBoundary><DepthGuage /></ErrorBoundary>
          <ErrorBoundary><WindBarb /></ErrorBoundary>
          <ErrorBoundary><PassagePlan /></ErrorBoundary>
          <ErrorBoundary><Chart /></ErrorBoundary>
          <SignedIn>
            <Suspense fallback={null}>
              <ErrorBoundary>
                <FloatingChat/>
              </ErrorBoundary>
            </Suspense>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

export default App
