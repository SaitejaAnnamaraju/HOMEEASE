import { useEffect, useRef } from 'react';

/**
 * React <-> AngularJS bridge.
 * React only owns the empty host <div>. The AngularJS module creates and manages
 * its own child DOM inside it, so the two frameworks never touch the same nodes.
 * The Angular code is loaded lazily so it only ships when a helper opens this screen.
 */
export default function AngularAvailability({ workerId }) {
  const hostRef = useRef(null);

  useEffect(() => {
    let cleanup = null;
    let cancelled = false;
    import('../angular-module/availability.js').then(({ mountAvailabilityModule }) => {
      if (!cancelled && hostRef.current) cleanup = mountAvailabilityModule(hostRef.current, workerId);
    });
    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
  }, [workerId]);

  return <div ref={hostRef} className="angular-host" data-framework="angularjs" />;
}
