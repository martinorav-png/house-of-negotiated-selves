import 'package:flutter/material.dart';
import 'widgets/room_view.dart';
import 'widgets/system_state_panel.dart';

class SimulationScreen extends StatelessWidget {
  const SimulationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mirror Simulation'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              // TODO: Reset simulation state
            },
          ),
        ],
      ),
      body: Row(
        children: [
          Expanded(
            flex: 3,
            child: RoomView(),
          ),
          const SizedBox(width: 16),
          Expanded(
            flex: 1,
            child: SystemStatePanel(),
          ),
        ],
      ),
    );
  }
}
