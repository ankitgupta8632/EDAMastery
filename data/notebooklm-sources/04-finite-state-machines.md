# Finite State Machines

> **Module:** Digital Design | **Phase:** Foundations | **Difficulty:** intermediate | **Reading time:** 15 min

---

# Finite State Machines: The Controllers That Run Everything

Imagine you're debugging a Protium compilation where the design mysteriously hangs during certain test scenarios. You trace through waveforms and find that a protocol controller is stuck in an unexpected state — it received a valid response but somehow can't transition to the next phase. Sound familiar? You've just encountered the heart of digital design: finite state machines (FSMs). These are the software engineers' equivalent of control flow logic, but implemented in hardware that must handle parallel execution, timing constraints, and reset conditions that would make any software developer's head spin.

## Why This Matters for Your Protium Work

FSMs are everywhere in the designs you're helping prototype. Every bus controller (PCIe, AXI, DDR), every cache coherency protocol, and every custom accelerator relies on carefully designed state machines. When Protium compilation reports timing violations or when debug runs reveal protocol violations, you're often looking at FSM implementation issues. Understanding how these machines work — and more importantly, how they can fail — will transform those cryptic compilation reports and waveform debugging sessions from mysterious black boxes into readable system behaviors. Plus, when your hardware colleagues discuss "state encoding trade-offs" or "one-hot vs. binary encoding," you'll understand the performance and area implications they're weighing.

## The Software Engineer's Mental Model

Think of FSMs as the hardware equivalent of a game state manager or a network protocol stack. Just like your software might have states like `CONNECTING`, `AUTHENTICATED`, `TRANSFERRING`, and `ERROR`, hardware FSMs have defined states with specific transition conditions. But here's the key difference: software state machines execute sequentially with clear before/after timing, while hardware FSMs must handle state transitions synchronously with a clock, deal with setup/hold timing requirements, and ensure clean resets to known states.

If you've ever written a TCP state machine or managed UI application states, you already understand the core concepts. The hardware twist is that every state transition happens exactly on a clock edge, and you must explicitly handle what happens during reset, power-up, and error conditions.

## Moore vs. Mealy: Two Fundamental Architectures

FSMs come in two primary flavors, each with distinct characteristics that affect timing, area, and debugging:

### Moore Machines
In a Moore machine, outputs depend **only** on the current state, not on the inputs. Think of it like a function where `output = f(current_state)`.

```verilog
// Moore Machine Example: Simple Traffic Light Controller
typedef enum logic [1:0] {
    RED    = 2'b00,
    YELLOW = 2'b01, 
    GREEN  = 2'b10
} state_t;

always_ff @(posedge clk or negedge reset_n) begin
    if (!reset_n) begin
        current_state <= RED;
        timer <= 0;
    end else begin
        case (current_state)
            RED: begin
                if (timer >= RED_TIME) begin
                    current_state <= GREEN;
                    timer <= 0;
                end else begin
                    timer <= timer + 1;
                end
            end
            // ... other states
        endcase
    end
end

// Moore output: only depends on state
always_comb begin
    case (current_state)
        RED:    {red_led, yellow_led, green_led} = 3'b100;
        YELLOW: {red_led, yellow_led, green_led} = 3'b010;
        GREEN:  {red_led, yellow_led, green_led} = 3'b001;
        default: {red_led, yellow_led, green_led} = 3'b000;
    endcase
end
```

**Moore Advantages:**
- Outputs are synchronous and stable (no glitches)
- Easier to debug — state determines output completely
- Better for pipelined designs where timing is critical

### Mealy Machines
In a Mealy machine, outputs depend on **both** the current state and the current inputs. It's like `output = f(current_state, inputs)`.

```verilog
// Mealy Machine Example: Simple Bus Arbiter
typedef enum logic [1:0] {
    IDLE  = 2'b00,
    GRANT = 2'b01,
    WAIT  = 2'b10
} arbiter_state_t;

always_ff @(posedge clk or negedge reset_n) begin
    if (!reset_n) begin
        current_state <= IDLE;
    end else begin
        case (current_state)
            IDLE: begin
                if (request_a || request_b) begin
                    current_state <= GRANT;
                end
            end
            GRANT: begin
                if (!request_a && !request_b) begin
                    current_state <= IDLE;
                end else if (new_request) begin
                    current_state <= WAIT;
                end
            end
            // ... other states
        endcase
    end
end

// Mealy output: depends on both state AND inputs
always_comb begin
    grant_a = 1'b0;
    grant_b = 1'b0;
    case (current_state)
        IDLE: begin
            // No grants in idle
        end
        GRANT: begin
            if (request_a && !higher_priority_request) grant_a = 1'b1;
            else if (request_b) grant_b = 1'b1;
        end
        WAIT: begin
            // Conditional grants based on current inputs
            if (timeout && request_a) grant_a = 1'b1;
        end
    endcase
end
```

**Mealy Advantages:**
- Can respond to inputs immediately (one clock cycle faster)
- Often requires fewer states for complex protocols
- More compact for designs with many input conditions

## State Encoding: The Performance vs. Debug Trade-off

How you encode your states dramatically affects area, power, timing, and debuggability. Here are the main approaches:

| Encoding Type | Example (4 states) | Area | Speed | Debug | Power |
|---------------|-------------------|------|-------|-------|-------|
| Binary | 00, 01, 10, 11 | Smallest | Fast decode | Hard | Lowest |
| One-hot | 0001, 0010, 0100, 1000 | Larger | Fastest | Easy | Higher |
| Gray code | 00, 01, 11, 10 | Small | Fast | Medium | Low |
| Custom | Application-specific | Varies | Varies | Varies | Varies |

### Binary Encoding
```verilog
typedef enum logic [1:0] {
    IDLE = 2'b00,
    READ = 2'b01, 
    WRITE = 2'b10,
    ERROR = 2'b11
} binary_state_t;
```
**When to use:** Resource-constrained designs, simple FSMs, when debugging isn't critical.

### One-hot Encoding  
```verilog
typedef enum logic [3:0] {
    IDLE  = 4'b0001,
    READ  = 4'b0010,
    WRITE = 4'b0100, 
    ERROR = 4'b1000
} onehot_state_t;
```
**When to use:** High-performance designs, complex state machines, when you need fast decode logic.

The choice often comes down to your priorities: binary encoding saves flip-flops but requires decode logic; one-hot uses more flip-flops but makes state transitions and debugging much simpler.

## FSM Design Best Practices for Synthesis

### 1. Always Include a Default State
```verilog
always_comb begin
    next_state = current_state; // Default: stay in current state
    case (current_state)
        IDLE: if (start) next_state = ACTIVE;
        ACTIVE: if (done) next_state = IDLE;
        default: next_state = IDLE; // Recovery path for invalid states
    endcase
end
```

### 2. Separate State Registration from Logic
```verilog
// State register (sequential)
always_ff @(posedge clk or negedge reset_n) begin
    if (!reset_n) current_state <= IDLE;
    else current_state <= next_state;
end

// Next state logic (combinational)  
always_comb begin
    case (current_state)
        // ... state transitions
    endcase
end

// Output logic (combinational)
always_comb begin
    case (current_state)
        // ... output assignments  
    endcase
end
```

This separation makes your FSMs much easier to verify, debug, and modify.

### 3. Handle Reset Consistently
```verilog
always_ff @(posedge clk or negedge reset_n) begin
    if (!reset_n) begin
        current_state <= IDLE;
        // Reset all FSM outputs to safe values
        data_valid <= 1'b0;
        error_flag <= 1'b0;
        counter <= 0;
    end else begin
        current_state <= next_state;
        // ... other sequential logic
    end
end
```

## Practice Challenge: Protocol Controller Analysis

Consider a simple handshake protocol where a master sends data to a slave. The protocol requires:
1. Master asserts `valid` with data
2. Slave responds with `ready` when it can accept  
3. Transfer completes when both `valid` and `ready` are high
4. Master must wait for `ready` to deassert before next transfer

**Mental Exercise:** Design this as both a Moore and Mealy machine. Which approach would you choose and why? Think about:
- How many states each approach needs
- Which signals are outputs vs. internal state
- What happens if `ready` stays asserted unexpectedly
- How you'd handle timeout conditions

**Hint:** The Moore machine will need separate states for "data presented" and "waiting for ready to deassert," while the Mealy machine can combine these behaviors.

## Meeting Confidence Boost

After this lesson, when someone in a design review mentions:
- **"We're seeing setup violations in the FSM"** — You can ask whether they've considered the state encoding choice and decode path timing
- **"The controller is getting stuck in an unknown state"** — You can suggest looking at the default case handling and reset behavior  
- **"Should we use Moore or Mealy for this protocol?"** — You can discuss the timing vs. complexity trade-offs based on whether outputs need to be purely synchronous
- **"The state machine is too big after synthesis"** — You can recommend analyzing whether one-hot encoding might give better results despite using more flip-flops

You'll recognize FSM-related compilation warnings and can contribute meaningfully to architectural discussions about control logic implementation.

## Key Takeaways

• **Distinguish between Moore and Mealy machines** by understanding that Moore outputs depend only on state, while Mealy outputs depend on both state and inputs
• **Choose state encoding strategically** — binary for area, one-hot for speed and debug, based on your design priorities  
• **Structure FSM code with clear separation** between state registration, next-state logic, and output logic for maintainability and synthesis
• **Always include default cases and proper reset handling** to prevent FSMs from entering invalid states during corner cases
• **Recognize that FSMs are the control backbone** of most digital designs, from simple controllers to complex protocol engines in your Protium prototypes

---

## Protium FPGA Prototyping Connection

Finite state machines are fundamental to the designs you're prototyping on Protium. Every PCIe controller, DDR memory interface, and custom accelerator contains multiple FSMs managing protocol states, data flow control, and error handling. When Protium compilation reports timing violations, they're often in the decode logic of complex FSMs or in the fan-out paths from one-hot encoded states.

Understanding FSM implementation becomes critical when debugging Protium designs. Those waveform traces showing protocol violations or unexpected hangs? They're usually FSMs stuck in corner-case states that weren't properly handled in the original design. The state encoding choices made by the original designers directly impact your compilation results — designs with poorly chosen binary encodings might need complex decode logic that creates timing bottlenecks, while overly aggressive one-hot encodings can consume excessive FPGA resources and force Protium's placer into suboptimal solutions.

When you're working with multi-FPGA partitioning, FSMs that cross partition boundaries become especially challenging. The Protium compiler must carefully analyze state machine dependencies to ensure that distributed FSMs can maintain coherent state transitions across FPGA boundaries. Your understanding of Moore vs. Mealy trade-offs helps explain why some protocol controllers partition cleanly while others create timing closure nightmares that require careful constraint management.

---

## Discussion Questions

*These are great topics to explore in the podcast discussion:*

- You're debugging a Protium design where a bus controller occasionally gets stuck during high-frequency transactions. The FSM uses binary state encoding with complex decode logic. What's the most likely timing-related cause?
  - A) The state register setup time is violated due to decode path delays
  - B) The FSM has too many states for the available flip-flops
  - C) The reset signal is not properly synchronized
  - D) The FSM outputs are glitching between state transitions

- A protocol FSM needs to assert an acknowledgment signal as soon as a valid request arrives, without waiting for the next clock edge. Which FSM type and output strategy should you recommend?
  - A) Moore machine with combinational outputs
  - B) Mealy machine with combinational outputs
  - C) Moore machine with registered outputs
  - D) Either Moore or Mealy with registered outputs

- When choosing between one-hot and binary state encoding for a complex FSM in your Protium design, which statement is most accurate?
  - A) One-hot always uses fewer FPGA resources than binary
  - B) Binary encoding always provides faster state transitions
  - C) One-hot encoding simplifies debugging but uses more flip-flops
  - D) The encoding choice doesn't affect synthesis timing or area

- An FSM should always include a default case in its state transition logic, even if all valid states are explicitly handled.
  - True
  - False

