# What is Digital Design?

> **Module:** Digital Design | **Phase:** Foundations | **Difficulty:** beginner | **Reading time:** 10 min

---

# What is Digital Design?

Imagine you're looking at a Protium compilation report and see line items like "Logic Utilization: 45%" and "Flip-Flops: 892,456." Your colleague mentions that the design has "combinational timing issues" and needs "sequential optimization." What exactly are they talking about?

Welcome to digital design — the world where software meets silicon. As someone who thinks in algorithms and data structures, you're about to discover how hardware "thinks" in fundamentally different ways.

## Why This Matters

Understanding digital design is your gateway to becoming a true contributor on the Protium team. When you grasp how digital circuits work, those Protium compilation messages transform from cryptic warnings into actionable insights. You'll understand why certain design choices impact FPGA resource usage, why timing closure matters, and how to help customers optimize their prototypes. Most importantly, you'll stop feeling like an outsider in design reviews and start contributing meaningful technical insights.

## The Digital Foundation: Everything is 0s and 1s

Let's start with what you already know: computers process information as binary digits (bits). But here's where hardware differs from software — in digital design, these 0s and 1s represent actual electrical voltages.

- **Digital "1"**: High voltage (typically 3.3V or 1.8V)
- **Digital "0"**: Low voltage (typically 0V)

Think of it like this: if software is about manipulating abstract data, hardware is about manipulating electricity in precise, predictable ways.

## Logic Gates: Hardware's Primitive Operations

Just as your C++ code uses operators like `&&`, `||`, and `!`, digital circuits use logic gates. These are the hardware equivalent of your basic operations:

```verilog
// AND gate - like the && operator
module and_gate(input a, input b, output y);
    assign y = a & b;  // y is 1 only when both a AND b are 1
endmodule

// OR gate - like the || operator  
module or_gate(input a, input b, output y);
    assign y = a | b;  // y is 1 when either a OR b (or both) is 1
endmodule

// NOT gate - like the ! operator
module not_gate(input a, output y);
    assign y = ~a;     // y is the opposite of a
endmodule
```

These gates consume actual FPGA resources. When Protium reports "Logic Utilization," it's counting how many of these basic building blocks your design requires.

## Combinational vs Sequential Logic: The Time Dimension

This is where digital design gets interesting and differs most from software:

### Combinational Logic
Like a pure function in programming — outputs depend only on current inputs, no memory of the past:

```verilog
// Combinational logic - like a function with no side effects
module address_decoder(
    input [1:0] select,
    output [3:0] enable
);
    assign enable = (select == 2'b00) ? 4'b0001 :
                   (select == 2'b01) ? 4'b0010 :
                   (select == 2'b10) ? 4'b0100 :
                                      4'b1000;
endmodule
```

### Sequential Logic  
Like an object with state — outputs depend on both current inputs AND stored state:

```verilog
// Sequential logic - like an object with member variables
module counter(
    input clk,           // Clock signal - the heartbeat
    input reset,
    output [3:0] count
);
    reg [3:0] count_reg;  // This is the "memory" - state storage
    
    always @(posedge clk or posedge reset) begin
        if (reset)
            count_reg <= 0;      // Initialize state
        else
            count_reg <= count_reg + 1;  // Update state
    end
    
    assign count = count_reg;
endmodule
```

The `reg [3:0] count_reg` line creates actual storage elements (flip-flops) in the FPGA — this is what shows up in that "Flip-Flops: 892,456" count in your Protium reports.

## The Clock: Hardware's Event Loop

In software, your program executes instructions sequentially (ignoring multi-threading for now). In digital design, everything happens in sync with a **clock signal** — think of it as hardware's event loop that fires billions of times per second.

```verilog
// Clock edge triggers state updates - like an event handler
always @(posedge clk) begin
    // This code executes on every rising edge of the clock
    data_reg <= new_data;  // Update happens here
end
```

Every flip-flop in your design updates simultaneously on each clock edge. This is why timing is so critical — all these updates must complete before the next clock edge arrives.

## Software Engineer's Mental Model

Think of digital design this way:

| Software Concept | Digital Design Equivalent |
|------------------|---------------------------|
| Variables | Registers (flip-flops) |
| Functions | Combinational logic blocks |
| Event handlers | Sequential logic (clocked processes) |
| Memory allocation | Resource utilization |
| Execution time | Propagation delay |
| Threads | Parallel logic paths |

The key difference: in software, operations happen one after another. In hardware, millions of operations happen simultaneously, all synchronized to clock edges.

## Two Types of Hardware "Thinking"

Digital circuits process information in two fundamental ways:

### Datapath
The "computational engine" — like your CPU's ALU:
- Arithmetic operations (addition, multiplication)  
- Data routing and selection
- Comparisons and logical operations

### Control Logic  
The "decision maker" — like your program's control flow:
- State machines (hardware's version of switch statements)
- Sequence control
- Conditional operations

Most digital designs combine both: control logic decides what operations to perform, datapath executes them.

## Practice Challenge

Consider a simple traffic light controller. Think through how you'd implement this:
- States: Red, Yellow, Green
- Inputs: Timer expired, pedestrian button
- Outputs: Light colors

How would you structure this differently than a software state machine? What would the clock represent? What gets stored in registers vs. computed combinationally?

## Meeting Confidence Boost

After this lesson, when someone in a design review says:
- **"We have combinational timing violations"** → You know they mean the logic gates between registers are too slow
- **"The design uses 2M flip-flops"** → You know they're talking about state storage elements
- **"We need to pipeline this datapath"** → You understand they want to add registers to break up long combinational paths

You can confidently respond: "Are we hitting setup time violations on the critical path?" or "Would adding pipeline stages help with the timing closure?"

## Key Takeaways

• **Recognize** that digital design manipulates electrical voltages, not abstract data
• **Understand** that logic gates are hardware's primitive operations, consuming actual FPGA resources  
• **Distinguish** between combinational logic (like pure functions) and sequential logic (like stateful objects)
• **Appreciate** that the clock synchronizes all state updates, making timing critical
• **Connect** flip-flop counts in Protium reports to actual state storage in your designs

---

## Protium FPGA Prototyping Connection

In Protium FPGA prototyping, understanding digital design fundamentals directly impacts your daily work. When Protium compiles a customer's design, it's mapping their RTL (written in languages like Verilog) onto the actual logic gates and flip-flops available in Xilinx FPGAs. Those resource utilization reports you see — "Logic Utilization: 45%, Flip-Flops: 892,456" — are counting exactly these digital building blocks we've discussed.

The combinational vs. sequential logic distinction becomes crucial during Protium's timing closure process. Combinational paths between flip-flops must complete within one clock cycle, and when they don't, you get timing violations that prevent the prototype from running at the target frequency. This is why Protium's incremental compilation and optimization algorithms focus heavily on balancing logic depth and adding pipeline stages when needed.

Understanding that everything synchronizes to clock edges also explains why Protium deals with multiple clock domains so carefully. When a customer's design has clocks running at different frequencies, Protium must ensure proper clock domain crossing techniques are used to prevent metastability — a hardware phenomenon that has no direct software equivalent but can cause prototype failures if not handled correctly.

---

## Discussion Questions

*These are great topics to explore in the podcast discussion:*

- Your Protium compilation report shows "Logic Utilization: 78%". What does this percentage primarily represent?
  - A) Memory usage on the host computer during compilation
  - B) CPU utilization during the synthesis process
  - C) The fraction of available FPGA logic gates being used by the design
  - D) The percentage of code coverage in the testbench

- In digital design, what is the primary difference between combinational and sequential logic?
  - A) Combinational logic runs faster than sequential logic
  - B) Sequential logic requires a clock signal and can store state, while combinational logic cannot
  - C) Combinational logic uses more FPGA resources than sequential logic
  - D) Sequential logic only works with binary numbers while combinational logic works with any base

- If a Protium design has "Flip-Flops: 1,250,000", what does this number represent?
  - A) The number of clock cycles needed for simulation
  - B) The amount of state storage elements instantiated in the FPGA
  - C) The frequency at which the design operates
  - D) The number of input/output pins being used

- In digital hardware, a clock signal serves the same purpose as an event loop in software.
  - True
  - False

