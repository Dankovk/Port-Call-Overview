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

