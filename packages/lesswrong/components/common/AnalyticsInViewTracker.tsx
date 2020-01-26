import { registerComponent } from 'meteor/vulcan:core';
import React, { useEffect, useCallback } from 'react';
import { useIsInView, useTracking } from "../../lib/analyticsEvents";

const AnalyticsInViewTracker = ({eventType, eventProps, observerProps, children, skip}) => {
  const { setNode, entry } = useIsInView(observerProps)

  const captureInViewEvent = useCallback(
    useTracking({ eventType: eventType || "inViewEvent", eventProps: {...eventProps, ...observerProps}}).captureEvent,
    // absolutely no reason for eventType or props to change for InView tracker once created, easiest way to prevent rerender because of object props
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])

  useEffect(() => {
    if (!skip && !!entry) {
      const {time, isIntersecting, intersectionRatio} = entry
      captureInViewEvent(undefined, {time, isIntersecting, intersectionRatio})
    }
  }, [entry, captureInViewEvent, skip])

  return (
    <span ref={setNode}>
      { children }
    </span>
  )
}

const AnalyticsInViewTrackerComponent = registerComponent('AnalyticsInViewTracker', AnalyticsInViewTracker)

declare global {
  interface ComponentTypes {
    AnalyticsInViewTracker: typeof AnalyticsInViewTrackerComponent
  }
}