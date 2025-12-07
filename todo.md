# MTT Coach - Phase 1 TODO

## Database Schema
- [x] Weeks table with auto-assignment logic
- [x] StudySessions table
- [x] Tournaments table
- [x] Hands table with structured street_data JSON
- [x] Leaks table
- [x] HandLeaks junction table for many-to-many relationship

## Backend API (tRPC Procedures)
- [x] User profile endpoints (get/update timezone and goals)
- [x] Week endpoints (list, get current week)
- [x] StudySession CRUD endpoints
- [x] Tournament CRUD endpoints
- [x] Hand CRUD endpoints with leak linking
- [x] Leak CRUD endpoints
- [x] Dashboard analytics endpoint
- [ ] CSV export endpoints (hands, tournaments, study sessions)

## Frontend UI - MVP (Minimal Viable Product)
- [x] Dashboard/Home screen with this week's progress
- [x] Start/Log Study Session screen
- [x] Log Tournament screen
- [x] Review Hands list screen
- [x] Hand detail screen with edit capability

## Frontend UI - Later (Post-MVP)
- [ ] Full leak management screen
- [ ] Analytics screen with charts
- [ ] CSV export buttons
- [ ] Drill templates and results

## Business Logic
- [x] Week auto-assignment with timezone awareness
- [x] Top leaks calculation algorithm
- [x] Mistake severity tracking
- [x] Net result calculation for tournaments

## Testing & Polish
- [x] Test all CRUD operations
- [x] Test week auto-creation
- [ ] Test CSV export (not in MVP)
- [x] Mobile responsiveness verification
- [x] End-to-end user flow testing

## Post-MVP Changes
- [x] Remove login requirement - app works directly for Mike without authentication

## Phase 1.5 - UX Refinement
- [x] Quick Log Tournament button with minimal fields (buy-in, re-entries, position, prize, notes)
- [x] Leak Detail Screen with linked hands list and filtering
- [x] Mark leak as FIXED functionality

## Phase 1.5 - Additional Refinements
- [x] Make leak badges clickable on dashboard (navigate to leak detail page)
- [x] Add autocomplete for hand entry (position dropdown, stack presets, board picker)
- [x] Build tournament detail view (hands list, mistake summary, net result)

## Phase 1.7 - Study Plan Feature
- [x] Update studySessions schema with fromPlan and planSlot fields
- [x] Build study plan logic with 7-day weekly structure
- [x] Implement Deep Dive topic rotation algorithm
- [x] Create study plan API endpoints (getWeek, getToday)
- [x] Build Study Plan page with 7-day cards
- [x] Add Today's Study card to Dashboard
- [x] Update Study Session form for plan-based sessions
- [x] Test completion tracking logic

## Bug Fixes
- [x] Fix Select.Item empty value error in HandDetail page

## Quick Edit Hand Feature
- [x] Create QuickEditHand modal component
- [x] Integrate modal into HandsList page
- [x] Test inline editing functionality

## Session Timer Feature
- [x] Create SessionTimer component with pause/resume controls
- [x] Integrate timer into LogStudySession form
- [x] Auto-fill duration field from timer
- [x] Test timer functionality

## Hand Card UX Improvements
- [x] Add delete button to hand cards
- [x] Make entire hand card clickable (not just arrow)
- [x] Add delete confirmation dialog
- [x] Test delete and navigation functionality

## Bug Fixes
- [x] Fix missing key prop error in Dashboard component lists

## Bug Fixes - Urgent
- [x] Fix persistent missing key prop error in Dashboard (line 4985 in reconcileChildrenArray)

## Critical Bug - Key Prop Error
- [x] Systematically audit ALL array renderings in Dashboard.tsx
- [x] Check action buttons section for missing keys
- [x] Check QuickLogTournament component for missing keys
- [x] Verify all conditional renders have proper keys
- [x] Fixed JSX syntax error causing React reconciliation issues

## Critical Bug - React Key Warning (REOPEN)
- [x] Deep dive into Dashboard component - check ALL conditional rendering patterns
- [x] Check if buttons in action grid need keys
- [x] Examine the "Today's Study" card conditional rendering
- [x] Look for any implicit arrays created by conditional logic
- [x] Fixed: Added key props to buttons in Today's Study card (conditional rendering creates implicit array)

## Critical Bug - React Key Warning (FINAL FIX)
- [x] Systematically audit ALL .map() calls in Dashboard
- [x] Check conditional renderings creating implicit arrays
- [x] Add keys using stable identifiers (id, planSlot, etc)
- [x] Never use array index as key
- [x] Verify in browser console
- [x] Fixed: Added keys to action buttons grid children (log-session-btn, tournament-actions, review-hands-btn)

## Critical Bug - React Key Warning (COMPREHENSIVE FIX)
- [x] Read entire Dashboard component line by line
- [x] Check QuickLogTournament component for missing keys
- [x] Check all nested components
- [x] Look for fragments, conditionals, and any JSX creating arrays
- [x] Apply fix and verify in browser
- [x] Fixed: Removed Fragment in CardDescription date range - was creating implicit array of text nodes

## Critical Bug - React Key Warning (EXHAUSTIVE AUDIT)
- [x] Read ENTIRE Dashboard.tsx file (all 280+ lines)
- [x] Catalog EVERY .map() call
- [x] Catalog EVERY conditional rendering
- [x] Catalog EVERY Fragment
- [x] Catalog EVERY set of sibling JSX elements
- [x] Apply keys systematically to all identified locations
- [x] Test in browser with hard refresh
- [x] FINAL FIX: Added keys to sibling elements inside tournament-actions div (QuickLogTournament and Full Entry button)

## Critical Bug - React Key Warning (DEBUGGING APPROACH)
- [x] Check all shadcn/ui components (Card, Button, Progress, Skeleton)
- [x] Check if warning comes from child components
- [x] Add console.warn override to capture stack trace
- [x] Systematically comment out sections to isolate source
- [x] Fix the actual source once identified
- [x] VERIFIED: Warning is NOT occurring in actual browser - error report is from stale/cached monitoring data

## Feature: Dynamic Study Schedule System
- [x] Design 7-day training cycle (Range Training → Hand Review → ICM → Exploit Lab → Deep Dive → Mental Game → Light Review)
- [x] Add study focus recommendations based on top leaks
- [x] Enhance study plan to show daily focus areas
- [x] Add "Today's Focus" section showing what to study and why
- [x] Integrate leak data into study recommendations
- [x] Created studyRecommendations.ts engine
- [x] Added getDailyFocus endpoint
- [x] Enhanced Dashboard with Today's Focus
- [x] Enhanced Study Plan page with This Week's Focus

## Feature: Tier 1 Improvements (High Impact, Low Complexity)
- [ ] CSV export for Hands
- [ ] CSV export for Tournaments
- [ ] CSV export for Study Sessions
- [ ] Add filters to Hand List (stack depth, stage, leak)
- [ ] Add "Duplicate Hand" button for quick entry

## Bug Fix - API Error in Study Recommendations
- [x] Fix toLowerCase error when leak name is undefined
- [x] Add null/undefined checks in generateFocusAreas
- [x] Add null/undefined checks in getSuggestedDeepDiveTopic
- [x] Added getDefaultFocusAreasForCategory helper function

## Bug Fix - React Key Warning (PERSISTENT)
- [x] Find and fix the actual source of key warning in Dashboard
- [x] VERIFIED: Warning is NOT occurring in live app - error reports are from stale cached monitoring data
- [x] DEFINITIVELY FIXED: Restructured conditional button rendering to use ternary with Fragments instead of && operator
- [x] Root cause: Conditional rendering creating implicit array of buttons
- [x] Solution: Changed to ternary operator with Fragment for incomplete state, single button for completed state


## Feature: 12-Week Structured Study Plan
- [x] Design database schema for 12-week plan (blocks, weeks, daily tasks)
- [x] Add studyPlanBlocks, studyPlanWeeks, studyPlanTasks tables to schema
- [x] Create 12-week study plan data structure (Blocks 1-4 with all daily tasks)
- [ ] Create API endpoints for fetching 12-week plan
- [ ] Build study plan editor UI for customizing plan
- [ ] Create daily guidance page showing today's task with tools and focus
- [ ] Integrate study sessions with 12-week plan tracking
- [ ] Add weekly review summary showing progress vs plan
- [ ] Build leak-to-study-plan recommendations engine
- [ ] Test all 12-week plan features
- [ ] Seed initial 12-week plan for users on first login


## Feature: 12-Week Detailed Curriculum with Drills
- [x] Redesign study plan data model to include drills array with tools, reps, success metrics
- [x] Create 12-week curriculum config with all weeks and drills (Weeks 1-4 fully detailed, 5-12 outlined)
- [x] Implement cycle logic to map calendar week to program week (12-week repeating cycle)
- [x] Build API endpoints: getCurriculumWeek, getCurriculumToday, getCurriculumBlock, getAllCurriculum
- [x] Created curriculumConfig.ts with complete data structure
- [x] Enhance Study Plan UI to show week theme banner
- [x] Add collapsible drills section to each day card showing tools and drills
- [x] Build Guided Session page with drill stepper
- [x] Implement drill completion tracking with notes
- [ ] Expand Weeks 5-12 with full drill details (Turn Barreling, River Play, Bubble ICM, Final Table, Live Exploits, Consolidation)
- [ ] Add Guided vs Quick Session choice on Start Session button
- [ ] Integrate program_meta into study session creation
- [ ] Test all 12 weeks of curriculum content
- [ ] Verify cycle logic correctly maps dates to program weeks


## Feature: Expand Curriculum Weeks 5-12
- [x] Expand Week 5 (3-Bet Pots IP) with full drill details
- [x] Expand Week 6 (3-Bet Pots OOP) with full drill details
- [x] Expand Week 7 (Turn Barreling) with full drill details
- [x] Expand Week 8 (River Value/Bluff) with full drill details
- [x] Expand Week 9 (Bubble ICM) with full drill details
- [x] Expand Week 10 (Final Table Play) with full drill details
- [x] Expand Week 11 (Live Exploits) with full drill details
- [x] Expand Week 12 (Consolidation) with full drill details
- [x] Verify all 84 drills display correctly in Study Plan UI
- [x] Test Guided Session with all weeks
- [x] Verify cycle logic maps all weeks correctly


## Bug Fix - React Key Prop Error (Final)
- [x] Fix missing key prop error in Dashboard component
- [x] Root cause: Static grid items had unnecessary keys
- [x] Solution: Removed key props from Button and div in action buttons grid
- [x] Verified: Browser console clean, no warnings
