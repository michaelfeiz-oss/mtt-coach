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
