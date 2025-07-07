# Port Call Overview - Maritime Demurrage Calculator

A sophisticated Vue.js application for analyzing port call operations in the maritime shipping industry, calculating laytime, and determining demurrage charges based on contract clauses.

## 🚢 What This Application Does

This application simulates the complex business process of **demurrage calculation** in maritime shipping:

1. **Analyzes Port Call Events**: Processes a Statement of Facts (SOF) containing timestamped events during a vessel's port stay
2. **Applies Contract Rules**: Interprets complex contract clauses that define how time should be calculated
3. **Calculates Financial Impact**: Determines demurrage (penalties) or dispatch (bonuses) based on performance

### Key Maritime Concepts

- **Port Call**: The period a ship spends at a port
- **Statement of Facts (SOF)**: Chronological record of all events during port stay
- **Laytime**: Contractually agreed time for cargo operations
- **Demurrage**: Financial penalty when operations exceed allowed time
- **Contract Clauses**: Business rules defining time calculations

## 🏗️ Improved Architecture

The application has been refactored with a modern, scalable architecture:

### State Management (Pinia)
- **Centralized Data Flow**: Single source of truth for all application state
- **Reactive Updates**: Components automatically update when data changes  
- **Error Handling**: Comprehensive error states and loading indicators

### Service Layer Architecture
```
src/
├── stores/
│   └── port-call-store.ts        # Centralized state management
├── services/
│   ├── api/
│   │   ├── contract-api.ts       # Contract data fetching
│   │   └── sof-api.ts            # SOF data fetching
│   ├── laytime/
│   │   ├── clause-processor.ts   # Contract clause logic
│   │   └── demurrage-calculator.ts # Financial calculations
│   └── contract-service.ts       # Backwards compatibility
├── utils/
│   ├── event-mapper.ts           # Type-safe event mapping
│   └── sof-converter.ts          # Data transformation
└── components/
    ├── App.vue                   # Main application
    ├── PortCallContainer.vue     # Dashboard container
    ├── Calculator.vue            # Events timeline
    ├── CargoDetailsPanel.vue     # Cargo information
    └── ContractClausesPanel.vue  # Contract results
```

### Key Improvements

#### 1. **Centralized State Management**
- All data flows through a Pinia store
- Components are presentation-focused
- Single data fetching point eliminates redundancy

#### 2. **Modular Service Architecture**
- **API Layer**: Dedicated modules for data fetching
- **Business Logic Layer**: Separated domain-specific calculations
- **Utility Layer**: Reusable transformation functions

#### 3. **Enhanced Type Safety**
- Comprehensive TypeScript interfaces
- Type-safe event mapping with enums
- Eliminated all `any` types

#### 4. **Improved Error Handling**
- Loading states for each operation
- Graceful error recovery
- User-friendly error messages

#### 5. **Component Simplification**
- Props-based data flow removed
- Business logic extracted to stores/services
- Enhanced maintainability

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ or Bun
- Vue CLI

### Installation
```bash
# Install dependencies
bun install

# Start development server  
bun run serve

# Build for production
bun run build
```

### Development with Bun
This project is optimized for Bun as the package manager and script runner:
```bash
bun run serve    # Development server
bun run build    # Production build
bun run lint     # Code linting
```

## 📊 Data Flow

### 1. Application Initialization
```typescript
// App.vue loads and initializes the store
await portCallStore.initializePortCall()
```

### 2. Data Processing Pipeline
```
SOF JSON → Event Mapping → Contract Processing → Demurrage Calculation
```

### 3. Store Actions
- `initializePortCall()`: Orchestrates the entire data pipeline
- `fetchPortCallData()`: Loads and processes SOF data
- `applyContractLogic()`: Processes contract clauses
- `calculateDemurrageResults()`: Computes financial impact

## 🧪 Testing the Application

### Sample Data
The application includes realistic sample data:
- **SOF Data** (`public/sof.json`): Maritime events timeline
- **Contract Data** (`public/contract.json`): Business rules and clauses

### Key Features to Test
1. **Real-time Calculations**: Watch demurrage update as contract logic is applied
2. **Event Timeline**: Interactive timeline of port call events
3. **Contract Clauses**: View which clauses are active and their effects
4. **Error Handling**: Robust error states and recovery

## 🔧 Configuration

### Event Mapping
Events are mapped using a type-safe enum system in `src/utils/event-mapper.ts`:
```typescript
export enum MaritimeEventCode {
  NOR_TENDERED = 'nor_tendered',
  BERTHED = 'berthed',
  DISCHARGE_COMMENCED = 'discharge_commenced',
  // ... more events
}
```

### Contract Processing
Contract clauses are processed through a sophisticated pipeline that:
1. Evaluates conditional logic (AND/OR operations)
2. Resolves event selectors to find relevant events  
3. Creates time ranges for additions/deductions
4. Calculates final demurrage amounts

## 📁 Project Structure

### Core Files
- `src/App.vue`: Main application component with error handling
- `src/stores/port-call-store.ts`: Central state management
- `src/components/PortCallContainer.vue`: Main dashboard
- `src/services/`: Business logic and API calls
- `src/utils/`: Helper functions and transformations
- `src/types.ts`: TypeScript type definitions

### Sample Data
- `public/sof.json`: Statement of Facts with port call events
- `public/contract.json`: Contract clauses and business rules

## 🎯 Architecture Benefits

### Maintainability
- Clear separation of concerns
- Modular, testable code structure
- Consistent patterns throughout

### Scalability  
- Easy to add new event types
- Extensible contract clause system
- Plugin-ready architecture

### Developer Experience
- Strong TypeScript support
- Hot reload during development
- Comprehensive error messaging

### Performance
- Efficient data fetching with caching
- Reactive updates only where needed
- Optimized bundle size

## 🔮 Future Enhancements

### Planned Improvements
1. **Backend Integration**: Replace frontend calculations with API calls
2. **Real-time Updates**: WebSocket integration for live data
3. **Advanced Reporting**: Export capabilities and detailed analytics  
4. **Multi-tenant Support**: Handle multiple contracts and port calls
5. **Mobile Optimization**: Responsive design improvements

### Technical Debt Addressed
- ✅ Eliminated redundant data fetching
- ✅ Removed component-level business logic
- ✅ Improved type safety throughout
- ✅ Centralized error handling
- ✅ Modularized service architecture

## 📚 Maritime Domain Knowledge

This application demonstrates real-world maritime concepts:

### Business Process
1. **Vessel Arrival**: NOR (Notice of Readiness) tendered
2. **Acceptance**: Port accepts vessel for operations  
3. **Berthing**: Vessel secures to berth
4. **Cargo Operations**: Loading/discharging cargo
5. **Completion**: Operations finish, vessel departs

### Financial Calculations
- **Allowed Time**: Contractual time for operations
- **Used Time**: Actual time taken
- **Adjustments**: Contract-based additions/deductions
- **Result**: Demurrage charge or dispatch bonus

---

*This application showcases modern Vue.js architecture patterns applied to complex maritime business logic.*

# Request for Merge Request

Dear Candidate,

Thank you so much for taking the time to consider Voyager Portal! 
We know the interview process is time consuming and arduous - we've tried to make sure that you will be getting to know as much about us as we are getting to know about you, and we hope it's an interesting exercise.

Our customers in maritime shipping often have contracts that stipulate how long they can take for operations at port.
These contracts often have carve-outs to deduct time or to count time depending on what events happen at port or when they happen.
Herein you'll find a small sample application that applies a "digitized" version of a contract to a list of events to computes the total amount of time taken after any contractual deductions, and cites the relevant clauses of the contract.
This is actually a core problem we work on!
The contract is in public/contract.json and the events are in public/sof.json.

The code is deliberately not written well. In fact, we have tried to re-create existing problems in our real code base.

Your task is to review the code.  You may approach it as if you were writing the application from scratch - what would you have done differently?  You may also approach it as if you were giving constructive feedback to a colleague - what was done well?  what do you think could be improved?

But you should not limit your review to just code - is the information displayed in the most user-friendly way?  What would you do differently?  Can the user trace events back to the relevant contract clause? What if we needed to allow the user to add or delete events, how would you change the interface?  What if they needed to add or deduct time because of events?

Of course, this is a contrived example.  In the real world, contracts and lists of events wouldn't be hard coded in like this.  Where do you think they would live? 

We'd like to set you up for success as much as possible, so here is what we are trying to learn about you with this exercise:
 - can you read and critically assess new codebases in typescript and vue?
 - what is your approach to learning about the user's actual business case in maritime shipping?
 - How do you think about user interface design?
 - How do you argue for and persuade colleagues to make improvements?
 
When we meet synchronously on a video call, we'd like you to take us through your "code review" and tell us what you think from all of these different dimensions.

Best,

Matthew Eric Bassett
CTO Voyager Portal

# running the code

$ npm install
$ npm run serve

