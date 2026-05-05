# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into FrameRoom, a static client-side gallery wall builder. Because the project has no build tool or package manager, PostHog was loaded via the official CDN snippet injected into `index.html`. A thin `js/analytics.js` helper module wraps `window.posthog.capture()` for clean import across all ES modules. Ten events covering the full user journey — from photo upload through wall export — were instrumented across six JavaScript files.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `photos_uploaded` | User uploads one or more frame photos to the library | `js/upload.js` |
| `reference_photo_uploaded` | User uploads a reference photo of their real wall | `js/upload.js` |
| `layout_applied` | User applies a gallery wall layout template | `js/layouts.js` |
| `wall_exported` | User exports the gallery wall composition as a PNG (key conversion) | `js/export.js` |
| `wall_cleared` | User confirms clearing all frames from the wall | `js/app.js` |
| `wall_theme_changed` | User changes the wall background color theme | `js/app.js` |
| `wall_size_changed` | User changes the wall size preset | `js/app.js` |
| `frame_added_to_wall` | User places a frame onto the wall canvas | `js/wall.js` |
| `frame_deleted` | User removes a frame from the wall | `js/wall.js` |
| `tour_started` | User starts or restarts the guided product tour | `js/tour.js` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/372712/dashboard/1533073
- **User journey funnel: Upload → Add to wall → Export:** https://us.posthog.com/project/372712/insights/TmjsVqqJ
- **Key events trend (last 30 days):** https://us.posthog.com/project/372712/insights/TdWJIERd
- **Most popular layout templates:** https://us.posthog.com/project/372712/insights/oowUYhwZ
- **Wall theme preferences:** https://us.posthog.com/project/372712/insights/TLr4Qe96
- **Wall cleared — abandonment signal:** https://us.posthog.com/project/372712/insights/pBIRUaU6

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
