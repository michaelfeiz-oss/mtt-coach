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
