# Sequential Logic & Flip-Flops

> **Module:** Digital Design | **Phase:** Foundations | **Difficulty:** beginner | **Reading time:** 15 min

---

# Sequential Logic & Flip-Flops

## The Clock That Changed Everything

Imagine you're debugging a race condition in your C++ code. Two threads are trying to update the same variable, and sometimes you get the right result, sometimes you don't. The fix? Add proper synchronization — maybe a mutex or atomic operations. In the digital hardware world, we have the same problem: signals changing at unpredictable times, creating chaos. The solution? **Sequential logic with flip-flops** — hardware's version of synchronized access.

You've probably heard your Protium colleagues talk about "setup violations" or "hold time issues." These aren't abstract concepts — they're the fundamental timing constraints that make reliable digital systems possible.

## Why This Matters

Every digital system you've ever used — from your smartphone to the Protium FPGA boards — relies on sequential logic to store state and coordinate operations. Without flip-flops, we'd have no memory, no registers, no way to build complex state machines. As a Protium engineer, understanding sequential logic helps you grasp why timing closure is so critical and why certain design patterns work better than others in FPGA implementations.

This knowledge transforms vague concepts like "clock domains" and "timing violations" into concrete, debuggable problems with clear solutions.

## Combinational vs Sequential: The State Difference

Let's start with what you already know. In software, we distinguish between:
- **Pure functions**: Output depends only on inputs (like `add(a, b)`)
- **Stateful functions**: Output depends on inputs AND internal state (like `counter.increment()`)

Hardware has the same distinction:

**Combinational Logic**: Output depends only on current inputs
- Logic gates (AND, OR, NOT)
- Multiplexers
- Decoders
- Like pure functions — same inputs always produce same outputs

**Sequential Logic**: Output depends on inputs AND stored state
- Flip-flops and latches
- Registers
- State machines
- Like objects with member variables — behavior depends on history

```verilog
// Combinational: always the same output for same inputs
assign sum = a + b;

// Sequential: output depends on history
always @(posedge clock) begin
    counter <= counter + 1;  // State changes over time
end
```

## The D Flip-Flop: Your Basic Memory Cell

The **D flip-flop** (Data flip-flop) is the fundamental building block of sequential logic. Think of it as a single-bit variable that only updates at specific moments.

```verilog
// Simple D flip-flop
module d_flipflop (
    input  logic clock,    // When to update
    input  logic d,        // Data input (what to store)
    output logic q         // Data output (what's stored)
);
    
    always_ff @(posedge clock) begin
        q <= d;  // On rising edge of clock, store d into q
    end
    
endmodule
```

Here's the key insight: **The flip-flop only changes its output on the clock edge.** Between clock edges, `q` remains stable regardless of what `d` does. This is like having a variable that only updates when you call `update()` — it ignores all the chaos happening in between.

## Clock Edges: The Synchronization Points

Most flip-flops are **edge-triggered**, meaning they respond to transitions:
- **Positive edge-triggered (posedge)**: Updates when clock goes 0→1
- **Negative edge-triggered (negedge)**: Updates when clock goes 1→0

Think of the clock edge as a database transaction commit point — all changes happen atomically at that moment.

```verilog
// 8-bit register using positive edge-triggered flip-flops
module register_8bit (
    input  logic       clock,
    input  logic [7:0] data_in,
    output logic [7:0] data_out
);
    
    always_ff @(posedge clock) begin
        data_out <= data_in;  // All 8 bits update simultaneously
    end
    
endmodule
```

## Timing: Setup and Hold Requirements

Here's where hardware gets tricky compared to software. In your C++ code, when you write `x = 5`, the assignment happens "instantly." In hardware, physical signals take time to propagate and stabilize.

Every flip-flop has two critical timing requirements:

**Setup Time (tsu)**: How long the input must be stable BEFORE the clock edge
**Hold Time (th)**: How long the input must remain stable AFTER the clock edge

```
    ←tsu→      ←th→
Data: -------X=====X-------
                   ↑
Clock: ____________|‾‾‾‾‾‾
                Clock Edge
```

Violating these requirements is like trying to read a variable while another thread is modifying it — you get unpredictable results.

## Software Engineer's Mental Model

Think of a flip-flop as a **synchronized getter/setter pair**:

```cpp
class FlipFlop {
private:
    bool stored_value;
    
public:
    void clock_edge(bool new_input) {
        // This only happens on clock edges
        stored_value = new_input;
    }
    
    bool get_output() const {
        // This is always available
        return stored_value;
    }
};
```

The key differences from normal variables:
1. **Updates are synchronized**: Only happens on clock edges
2. **Setup/hold timing**: Input must be stable around the update moment
3. **Propagation delay**: Output doesn't change instantly after clock edge

## Register Files: Arrays of Flip-Flops

Just like you'd create an array of objects in software, hardware designers create **registers** (arrays of flip-flops) to store multi-bit values:

```verilog
// 32-bit register with enable
module register_32bit (
    input  logic        clock,
    input  logic        enable,    // Only update when enabled
    input  logic [31:0] data_in,
    output logic [31:0] data_out
);
    
    always_ff @(posedge clock) begin
        if (enable) begin
            data_out <= data_in;  // Conditional update
        end
        // If enable is false, data_out keeps its old value
    end
    
endmodule
```

This is like having a variable that only updates when a flag is set — perfect for building state machines and control logic.

## Reset: Getting to a Known State

Unlike software variables that start with undefined values, hardware flip-flops need explicit initialization. This is done with **reset** signals:

```verilog
// Flip-flop with asynchronous reset
module d_flipflop_reset (
    input  logic clock,
    input  logic reset_n,  // Active low reset
    input  logic d,
    output logic q
);
    
    always_ff @(posedge clock or negedge reset_n) begin
        if (!reset_n) begin
            q <= 1'b0;  // Reset to 0 immediately
        end else begin
            q <= d;     // Normal operation
        end
    end
    
endmodule
```

Reset is crucial for FPGA designs because you need predictable startup behavior — like calling a constructor that initializes all member variables.

## Practice Challenge

Consider this simple counter:

```verilog
module counter (
    input  logic       clock,
    input  logic       reset_n,
    output logic [3:0] count
);
    
    always_ff @(posedge clock or negedge reset_n) begin
        if (!reset_n) begin
            count <= 4'b0000;
        end else begin
            count <= count + 1;
        end
    end
    
endmodule
```

Mental walkthrough: If reset is released just before a clock edge, and the clock runs at 100MHz, how long does it take to count from 0 to 15? What happens after count reaches 15? (Hint: 4-bit counter means values 0-15, then wraps to 0)

## Meeting Confidence Boost

After this lesson, when someone in a design review mentions:

- **"Setup violation"** → You know they mean input data changed too close to the clock edge, violating setup time requirements
- **"Register inference"** → You can say "The synthesis tool is creating flip-flops to store that signal across clock cycles"
- **"Clock domain"** → You understand this refers to all flip-flops sharing the same clock signal
- **"Hold time issue"** → You know the data changed too quickly after the clock edge

You can confidently ask: "Is this a timing closure issue, or do we need to add pipeline stages?"

## Key Takeaways

- **Distinguish** combinational logic (output follows input) from sequential logic (output depends on stored state)
- **Recognize** that flip-flops are hardware's synchronized variables — they only update on clock edges
- **Understand** setup and hold timing requirements prevent race conditions in hardware
- **Apply** reset signals to ensure predictable startup behavior, like constructors in software
- **Connect** timing violations to real debugging scenarios — they're hardware's version of race conditions

---

## Protium FPGA Prototyping Connection

In Protium FPGA prototyping, sequential logic forms the backbone of every compiled design. When your RTL design gets mapped onto Protium's FPGAs, every register in your original design becomes flip-flops in the FPGA fabric. The Protium compiler must ensure all these flip-flops meet timing requirements across potentially multiple FPGA chips.

This is why Protium's timing analysis is so critical. If your design has setup or hold violations, they'll manifest as functional failures during prototyping — your design might work in simulation but fail on the actual Protium hardware. The compiler's job is to place and route your logic while preserving the timing relationships that make sequential logic work reliably. When you see timing closure reports in Protium, they're fundamentally about ensuring all the flip-flops in your design can operate correctly at the target clock frequency.

Understanding flip-flops also explains why certain Protium optimizations work. For example, register retiming can move flip-flops around your design to improve timing closure, and pipeline insertion adds flip-flops to break long combinational paths. These aren't abstract optimizations — they're concrete modifications to the flip-flop structure that makes your design implementable on FPGA hardware.

---

## Discussion Questions

*These are great topics to explore in the podcast discussion:*

- What is the main difference between combinational and sequential logic?
  - A) Combinational logic is faster than sequential logic
  - B) Sequential logic stores state and depends on clock edges, combinational logic doesn't
  - C) Combinational logic uses flip-flops, sequential logic uses gates
  - D) Sequential logic only works with positive voltages

- When does a positive edge-triggered D flip-flop update its output?
  - A) Whenever the input D changes
  - B) Only when the clock signal goes from high to low
  - C) Only when the clock signal goes from low to high
  - D) Continuously while the clock is high

- What happens if you violate the setup time requirement of a flip-flop?
  - A) The flip-flop will permanently break
  - B) The output will be inverted
  - C) The flip-flop may capture unpredictable data
  - D) The clock will stop working

- A flip-flop with reset can initialize its stored value to a known state when the system starts up.
  - True
  - False

