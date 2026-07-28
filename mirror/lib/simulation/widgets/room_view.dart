import 'package:flutter/material.dart';

class RoomView extends StatelessWidget {
  const RoomView({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade700),
        borderRadius: BorderRadius.circular(8),
      ),
      child: CustomPaint(
        painter: RoomPainter(),
        child: const SizedBox.expand(),
      ),
    );
  }
}

class RoomPainter extends CustomPainter {
  // Room dimensions (meters)
  static const double roomWidth = 8.6;
  static const double roomDepth = 4.8;
  static const double roomHeight = 2.8;

  // Scale factor for drawing (pixels per meter)
  double getScale(Size size) {
    final scaleX = (size.width - 40) / roomWidth;
    final scaleY = (size.height - 40) / roomDepth;
    return scaleX < scaleY ? scaleX : scaleY;
  }

  Offset roomToScreen(double x, double z, Size size) {
    final scale = getScale(size);
    final offsetX = (size.width - roomWidth * scale) / 2;
    final offsetZ = (size.height - roomDepth * scale) / 2;
    return Offset(offsetX + x * scale, offsetZ + z * scale);
  }

  @override
  void paint(Canvas canvas, Size size) {
    final scale = getScale(size);

    final roomPaint = Paint()
      ..color = Colors.grey.shade900
      ..style = PaintingStyle.fill;

    final wallPaint = Paint()
      ..color = Colors.grey.shade600
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final curtainPaint = Paint()
      ..color = Colors.cyan.shade300
      ..style = PaintingStyle.fill;

    final rodPaint = Paint()
      ..color = Colors.grey.shade400
      ..style = PaintingStyle.fill;

    final projectorPaint = Paint()
      ..color = Colors.green.shade400
      ..style = PaintingStyle.fill;

    final stationPaint = Paint()
      ..color = Colors.orange.shade400
      ..style = PaintingStyle.fill;

    final windowPaint = Paint()
      ..color = Colors.lightBlue.shade200
      ..style = PaintingStyle.fill;

    final doorPaint = Paint()
      ..color = Colors.brown.shade300
      ..style = PaintingStyle.fill;

    // Draw room background
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      roomPaint,
    );

    // Draw room outline
    final roomRect = Rect.fromLTWH(
      (size.width - roomWidth * scale) / 2,
      (size.height - roomDepth * scale) / 2,
      roomWidth * scale,
      roomDepth * scale,
    );
    canvas.drawRect(roomRect, wallPaint);

    // Draw grid
    final gridPaint = Paint()
      ..color = Colors.grey.shade800
      ..strokeWidth = 0.5;
    for (double x = 0; x <= roomWidth; x += 1.0) {
      final p1 = roomToScreen(x, 0, size);
      final p2 = roomToScreen(x, roomDepth, size);
      canvas.drawLine(p1, p2, gridPaint);
    }
    for (double z = 0; z <= roomDepth; z += 1.0) {
      final p1 = roomToScreen(0, z, size);
      final p2 = roomToScreen(roomWidth, z, size);
      canvas.drawLine(p1, p2, gridPaint);
    }

    // Draw curtain system (inner rectangle with rods)
    // Curtain footprint (approximate inner structure)
    final curtainLeft = 2.5;
    final curtainRight = 6.0;
    final curtainTop = 1.5;
    final curtainBottom = 3.5;

    // Draw curtain walls (dashed lines for doors)
    final curtainRect = Rect.fromLTWH(
      roomToScreen(curtainLeft, curtainTop, size).dx,
      roomToScreen(curtainLeft, curtainTop, size).dy,
      (curtainRight - curtainLeft) * scale,
      (curtainBottom - curtainTop) * scale,
    );
    
    // Solid curtain sections
    final solidCurtainPaint = Paint()
      ..color = Colors.cyan.shade300
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    
    canvas.drawLine(
      curtainRect.topLeft,
      curtainRect.topRight,
      solidCurtainPaint,
    );
    canvas.drawLine(
      curtainRect.bottomLeft,
      curtainRect.bottomRight,
      solidCurtainPaint,
    );
    canvas.drawLine(
      curtainRect.topLeft,
      curtainRect.bottomLeft,
      solidCurtainPaint,
    );
    
    // Door section (right side, dashed)
    final doorPaint2 = Paint()
      ..color = Colors.cyan.shade300
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    
    final doorStart = Offset(curtainRect.right, curtainRect.top);
    final doorEnd = Offset(curtainRect.right, curtainRect.top + curtainRect.height * 0.3);
    canvas.drawLine(doorStart, doorEnd, doorPaint2);

    // Draw curtain rods (4 corners)
    final rodSize = 6.0;
    final corners = [
      Offset(curtainRect.left, curtainRect.top),
      Offset(curtainRect.right, curtainRect.top),
      Offset(curtainRect.left, curtainRect.bottom),
      Offset(curtainRect.right, curtainRect.bottom),
    ];
    for (final corner in corners) {
      canvas.drawCircle(corner, rodSize / 2, rodPaint);
    }

    // Draw windows (front wall - bottom of screen)
    final windowWidth = 1.7 * scale;
    final windowHeight = 0.3 * scale;
    
    // Window 1
    final w1Pos = roomToScreen(1.9, 0, size);
    canvas.drawRect(
      Rect.fromCenter(
        center: Offset(w1Pos.dx, w1Pos.dy - windowHeight / 2),
        width: windowWidth,
        height: windowHeight,
      ),
      windowPaint,
    );
    
    // Window 2
    final w2Pos = roomToScreen(6.4, 0, size);
    canvas.drawRect(
      Rect.fromCenter(
        center: Offset(w2Pos.dx, w2Pos.dy - windowHeight / 2),
        width: windowWidth,
        height: windowHeight,
      ),
      windowPaint,
    );

    // Draw door (back wall - top of screen)
    final doorWidth = 1.0 * scale;
    final doorHeight = 0.3 * scale;
    final doorPos = roomToScreen(0, roomDepth, size);
    canvas.drawRect(
      Rect.fromCenter(
        center: Offset(doorPos.dx + doorWidth / 2, doorPos.dy + doorHeight / 2),
        width: doorWidth,
        height: doorHeight,
      ),
      doorPaint,
    );

    // Draw projectors
    final projectorSize = 10.0;
    
    // Projector 1 (Center Dual)
    final p1Pos = roomToScreen(3.8, 3.0, size);
    canvas.drawCircle(p1Pos, projectorSize / 2, projectorPaint);
    
    // Projector 2 (Bottom-Left)
    final p2Pos = roomToScreen(3.8, 4.65, size);
    canvas.drawCircle(p2Pos, projectorSize / 2, projectorPaint);
    
    // Projector 3 (Bottom-Right)
    final p3Pos = roomToScreen(7.5, 4.65, size);
    canvas.drawCircle(p3Pos, projectorSize / 2, projectorPaint);

    // Draw stations (mannequins)
    final stationSize = 14.0;
    
    // Station 1 (Gesture tracking/lobby)
    final s1Pos = roomToScreen(1.8, 3.0, size);
    canvas.drawCircle(s1Pos, stationSize / 2, stationPaint);
    
    // Station 2 (Hologram/conversational)
    final s2Pos = roomToScreen(4.2, 3.0, size);
    canvas.drawCircle(s2Pos, stationSize / 2, stationPaint);
    
    // Station 3 (Printout/artifact)
    final s3Pos = roomToScreen(7.8, 3.0, size);
    canvas.drawCircle(s3Pos, stationSize / 2, stationPaint);

    // Draw labels
    final textPainter = TextPainter(
      textDirection: TextDirection.ltr,
    );

    // Room label
    textPainter.text = const TextSpan(
      text: '8.6m × 4.8m × 2.8m',
      style: TextStyle(color: Colors.grey, fontSize: 10),
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(size.width / 2 - 40, size.height - 20),
    );

    // Curtain label
    textPainter.text = const TextSpan(
      text: 'Curtain System',
      style: TextStyle(color: Colors.cyan, fontSize: 10),
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(curtainRect.left + 10, curtainRect.top + 10),
    );

    // Projector labels
    textPainter.text = const TextSpan(
      text: 'P1',
      style: TextStyle(color: Colors.green, fontSize: 8),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(p1Pos.dx - 6, p1Pos.dy + 12));

    textPainter.text = const TextSpan(
      text: 'P2',
      style: TextStyle(color: Colors.green, fontSize: 8),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(p2Pos.dx - 6, p2Pos.dy + 12));

    textPainter.text = const TextSpan(
      text: 'P3',
      style: TextStyle(color: Colors.green, fontSize: 8),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(p3Pos.dx - 6, p3Pos.dy + 12));

    // Station labels
    textPainter.text = const TextSpan(
      text: 'S1',
      style: TextStyle(color: Colors.orange, fontSize: 10),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(s1Pos.dx - 6, s1Pos.dy + 16));

    textPainter.text = const TextSpan(
      text: 'S2',
      style: TextStyle(color: Colors.orange, fontSize: 10),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(s2Pos.dx - 6, s2Pos.dy + 16));

    textPainter.text = const TextSpan(
      text: 'S3',
      style: TextStyle(color: Colors.orange, fontSize: 10),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(s3Pos.dx - 6, s3Pos.dy + 16));

    // Window labels
    textPainter.text = const TextSpan(
      text: 'W1',
      style: TextStyle(color: Colors.lightBlue, fontSize: 8),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(w1Pos.dx - 6, w1Pos.dy + 8));

    textPainter.text = const TextSpan(
      text: 'W2',
      style: TextStyle(color: Colors.lightBlue, fontSize: 8),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(w2Pos.dx - 6, w2Pos.dy + 8));

    // Door label
    textPainter.text = const TextSpan(
      text: 'Door',
      style: TextStyle(color: Colors.brown, fontSize: 8),
    );
    textPainter.layout();
    textPainter.paint(canvas, Offset(doorPos.dx + 5, doorPos.dy + 8));

    // Legend
    final legendX = 10.0;
    final legendY = 10.0;
    final legendItems = [
      {'color': Colors.orange, 'label': 'Stations (S1-S3)'},
      {'color': Colors.green, 'label': 'Projectors (P1-P3)'},
      {'color': Colors.cyan, 'label': 'Curtain System'},
      {'color': Colors.lightBlue, 'label': 'Windows'},
      {'color': Colors.brown, 'label': 'Door'},
    ];

    for (int i = 0; i < legendItems.length; i++) {
      final item = legendItems[i];
      final y = legendY + i * 16.0;
      
      canvas.drawRect(
        Rect.fromLTWH(legendX, y, 8, 8),
        Paint()..color = item['color'] as Color,
      );
      
      textPainter.text = TextSpan(
        text: item['label'] as String,
        style: const TextStyle(color: Colors.white, fontSize: 9),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(legendX + 12, y - 1));
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
