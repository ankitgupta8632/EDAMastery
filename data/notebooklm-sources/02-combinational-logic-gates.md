# Combinational Logic Gates

> **Module:** Digital Design | **Phase:** Foundations | **Difficulty:** beginner | **Reading time:** 12 min

---

# Combinational Logic Gates

You're reviewing a Protium compilation report and see metrics like "Total LUTs: 125,847" and "Logic Utilization: 73%". Your colleague mentions that the design is "LUT-heavy" and suggests optimizing some combinational logic. What exactly is combinational logic, and why does it matter for your FPGA prototyping work?

## Why This Matters

Combinational logic gates are the fundamental building blocks of every digital circuit — including the complex SoC designs that Protium helps prototype. Understanding these gates isn't just academic; it directly impacts how efficiently your designs map to FPGA resources, how fast they run, and how much area they consume. When you grasp combinational logic, you'll understand why certain design patterns create timing issues, why some code synthesizes poorly, and what your colleagues mean when they discuss logic optimization strategies.

## The Software Engineer's Mental Model

Think of combinational logic gates like pure functions in programming — they have no memory, no side effects, and always produce the same output for the same inputs. Just as you combine simple functions to build complex algorithms, digital designers combine basic gates to create everything from adders to processors. The key difference: instead of data flowing through function calls over time, signals flow through gates instantly (well, with tiny propagation delays).

## Basic Logic Gates: The Essential Toolkit

### NOT Gate (Inverter)
The simplest gate — it flips the input signal. Think of it as the boolean `!` operator.

```verilog
// NOT gate in Verilog
module not_gate(
    input  wire a,    // Input signal
    output wire y     // Output = !a
);
    assign y = ~a;    // Tilde (~) is Verilog's NOT operator
endmodule
```

**Truth Table:**
| A | Y |
|---|---|
| 0 | 1 |
| 1 | 0 |

### AND Gate
Outputs 1 only when ALL inputs are 1. Like the `&&` operator, but for individual bits.

```verilog
// 2-input AND gate
module and_gate(
    input  wire a,
    input  wire b,
    output wire y     // Output = a AND b
);
    assign y = a & b;  // Single & for bitwise AND
endmodule
```

**Truth Table:**
| A | B | Y |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | 1 |

### OR Gate
Outputs 1 when ANY input is 1. Like the `||` operator for bits.

```verilog
// 2-input OR gate
module or_gate(
    input  wire a,
    input  wire b,
    output wire y     // Output = a OR b
);
    assign y = a | b;  // Single | for bitwise OR
endmodule
```

**Truth Table:**
| A | B | Y |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 1 |

### XOR Gate (Exclusive OR)
Outputs 1 when inputs are DIFFERENT. Think "one or the other, but not both."

```verilog
// XOR gate - outputs 1 when inputs differ
module xor_gate(
    input  wire a,
    input  wire b,
    output wire y     // Output = a XOR b
);
    assign y = a ^ b;  // Caret (^) for XOR
endmodule
```

**Truth Table:**
| A | B | Y |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

## Complex Combinational Circuits

### Multiplexer (MUX): The Hardware If-Statement

A multiplexer is like a switch or an if-statement in hardware. It selects one of several inputs based on a control signal.

```verilog
// 2-to-1 multiplexer (2 inputs, 1 output, 1 select line)
module mux2to1(
    input  wire a,        // Input 0
    input  wire b,        // Input 1  
    input  wire sel,      // Select: 0 chooses a, 1 chooses b
    output wire y         // Selected output
);
    assign y = sel ? b : a;  // Verilog ternary operator
    // Equivalent to: if (sel == 1) y = b; else y = a;
endmodule
```

**Truth Table:**
| A | B | SEL | Y |
|---|---|-----|---|
| 0 | 0 | 0   | 0 |
| 1 | 0 | 0   | 1 |
| 0 | 1 | 0   | 0 |
| 1 | 1 | 0   | 1 |
| 0 | 0 | 1   | 0 |
| 1 | 0 | 1   | 0 |
| 0 | 1 | 1   | 1 |
| 1 | 1 | 1   | 1 |

Multiplexers are everywhere in digital design. They implement conditional logic, data path selection, and are the building blocks of more complex structures like ALUs.

### Decoder: One-Hot Output Selection

A decoder takes a binary input and activates exactly one output line. Think of it like a function that converts an array index into a one-hot encoded selection.

```verilog
// 2-to-4 decoder (2 input bits, 4 output lines)
module decoder2to4(
    input  wire [1:0] sel,    // 2-bit input (can represent 0-3)
    output wire [3:0] out     // 4-bit output, one bit active
);
    assign out[0] = ~sel[1] & ~sel[0];  // Active when sel = 00
    assign out[1] = ~sel[1] &  sel[0];  // Active when sel = 01  
    assign out[2] =  sel[1] & ~sel[0];  // Active when sel = 10
    assign out[3] =  sel[1] &  sel[0];  // Active when sel = 11
endmodule
```

**Truth Table:**
| SEL[1:0] | OUT[3:0] |
|----------|----------|
| 00       | 0001     |
| 01       | 0010     |
| 10       | 0100     |
| 11       | 1000     |

## Building Blocks in Action: Full Adder

Let's see how basic gates combine to create something useful — a full adder that can add three 1-bit numbers (useful for multi-bit addition).

```verilog
// Full adder using basic gates
module full_adder(
    input  wire a,        // First bit to add
    input  wire b,        // Second bit to add
    input  wire cin,      // Carry input from previous stage
    output wire sum,      // Sum output
    output wire cout      // Carry output to next stage
);
    // Sum is 1 when odd number of inputs are 1
    assign sum = a ^ b ^ cin;
    
    // Carry out when at least 2 inputs are 1
    assign cout = (a & b) | (a & cin) | (b & cin);
endmodule
```

This seemingly simple circuit demonstrates how XOR creates the sum bit (odd parity) and how a combination of AND/OR gates generates the carry logic.

## Why Combinational Logic Matters for FPGA Design

FPGAs implement combinational logic using **Look-Up Tables (LUTs)** — small memory blocks that can implement any boolean function of their inputs. A 6-input LUT can implement any function of 6 variables, which covers most basic gates and small combinations.

**Key insights for your work:**
- **LUT efficiency**: Simple gates use LUTs efficiently, but complex boolean expressions might waste LUT resources
- **Timing paths**: Long chains of combinational logic create timing challenges — signals need time to propagate through gates
- **Resource utilization**: Understanding gate combinations helps you write Verilog that maps efficiently to FPGA resources

## Practice Challenge

Imagine you need to design a priority encoder — a circuit that finds the position of the highest-priority active input. Given 4 input signals `[3:0] inputs`, think through what the truth table would look like. What would the output be when `inputs = 4'b1010` (binary 1010)? How about when `inputs = 4'b1111`?

*Hint: Think about which bit position has the highest priority (usually the leftmost/highest-numbered bit).*

## Meeting Confidence Boost

After this lesson, when someone mentions "combinational logic" in a design review, you understand they're talking about circuits with no memory that compute outputs directly from current inputs. When you see LUT utilization numbers in Protium reports, you know those LUTs are implementing these boolean functions. If someone says "this path has too much combinational delay," you can ask about breaking up long logic chains or pipeline stages.

**Phrases you can use:**
- "Are we efficiently using our LUT resources for this combinational block?"
- "This looks like it could be implemented with a simple multiplexer structure"
- "The combinational delay through this logic might be our critical path"

## Key Takeaways

• **Master the basics**: NOT, AND, OR, XOR are your fundamental building blocks — everything else builds from these
• **Think in truth tables**: Every combinational function can be described by its input-output relationship
• **Recognize common patterns**: Multiplexers, decoders, and encoders appear everywhere in digital design
• **Connect to FPGA resources**: Combinational logic maps to LUTs, affecting both area and timing
• **Bridge to software**: Combinational logic is like pure functions — same inputs always produce same outputs, with no hidden state

---

## Protium FPGA Prototyping Connection

In Protium FPGA prototyping, understanding combinational logic directly impacts your compilation results and debug capabilities. When Protium compiles your SoC design, the synthesis tools break down complex RTL into basic gates, then map those gates to FPGA LUTs (Look-Up Tables). The "Total LUTs" number in your compilation reports represents how many of these combinational logic blocks your design requires. A 6-input LUT can implement any boolean function of up to 6 inputs — so simple gates like AND/OR use LUTs efficiently, while complex expressions might require multiple LUTs or create suboptimal mappings.

The combinational delay through logic gates also affects your prototype's maximum clock frequency. Long chains of gates (like a 32-bit ripple-carry adder built from the full adders we discussed) create timing violations because signals need time to propagate through each gate. This is why Protium's timing closure process is crucial — it ensures these combinational paths meet your target clock constraints. When you see timing violations in Protium reports, they often trace back to combinational logic paths that are too long or too complex.

For debug and verification, Protium's transaction-based debug probes often capture signals at the boundaries of combinational blocks. Understanding how multiplexers and decoders work helps you trace signal flow through your design and set meaningful breakpoints. When you're debugging a data path issue, knowing that a multiplexer selects between different input sources based on control signals helps you focus on the right logic when signals don't match expected values.

---

## Discussion Questions

*These are great topics to explore in the podcast discussion:*

- In FPGA design, what is the primary resource used to implement combinational logic gates?
  - A) Flip-flops
  - B) Look-Up Tables (LUTs)
  - C) Block RAM
  - D) DSP blocks

- What is the output of a 2-input XOR gate when both inputs are 1?
  - A) 0
  - B) 1
  - C) Undefined
  - D) High impedance

- In the context of combinational logic, what makes a circuit "combinational" rather than "sequential"?
  - A) It uses only NAND gates
  - B) It has no memory and outputs depend only on current inputs
  - C) It operates at high frequency
  - D) It requires a clock signal

- A 4-to-1 multiplexer requires 2 select bits to choose between its 4 inputs.
  - True
  - False

