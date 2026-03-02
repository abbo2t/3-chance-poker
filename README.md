# 3-chance-poker
An implementation of a casino table game in React

About the game:

Briefly, the game follows the traditional raise or fold format, where the final cards are revealed after the decision is made.

Rules

The games uses a single 52-card deck.
Play starts with the player making a 1st Shot wager. The player may make an optional 5 Shot side bet at this time.
The dealer shall deal the player two hole cards and three community cards, all face down.
After examining his own cards, the player must either raise or fold. If the player folds, he forfeits his 1st Shot wager, but any 5 Shot wager will still have action. If the player raises, he must make both a 2nd Shot and 3rd Shot wagers, both equal to the 1st Shot wager.
The dealer shall expose the three community cards.
The 1st Shot, 2nd Shot and 3rd Shot wagers shall be based on the poker value of the following three-card poker hands and the pay table below:
1st Shot — Two player hole cards and first community card.
2nd Shot — Two player hole cards and second community card.
3rd Shot — Two player hole cards and third community card.
The 5 Shot wager shall be based on the poker value of all five cards, between the player's two hole cards and all three community cards and the pay table below.
The following are the available pay tables for the 1st, 2nd and 3rd Shot wagers. Wins are on a "to one" basis. The Grand Sierra is using Pay Table 2.

1st, 2nd and 3rd Shot Pay Table

Hand	Pay Table 1	Pay Table 2	Pay Table 3
Mini royal	50	50	40
Straight flush	25	30	30
Three of a kind	10	20	10
Straight	5	4	5
Flush	2	2	2
Pair	1	1	1
All other	Loss	Loss	Loss
The following are the available pay tables for the 5 Shot wager. The Grand Sierra is using Pay Table 1.

5 Shot Pay Table

Hand	Pay Table 1	Pay Table 2	Pay Table 3
Royal flush	500	1000	1000
Straight flush	200	500	500
Four of a kind	50	50	200
Full house	40	40	100
Flush	30	30	50
Straight	20	20	10
Three of a kind	10	10	5
Two pair	2	2	2
Tens or better	1	1	1
All other	Loss	Loss	Loss
Example

3-shot-poker

In the image above, I bet $100 on the 1st Shot and $25 on the 5 Shot.  I was dealt a K/A offsuit.  Although the odds favor folding that, I raised anyway, betting aother $100 on each of the 2nd Shot and 3rd Shot. 

The two community cards came up as Q,2,Q.  That formed a straight for the 1st Shot and 3rd Shot, paying 4 to 1 odds for both.  The 2nd Shot was a loser.  The 5 Shot bet was a high pair, which paid 1 to 1.  All things considered, I bet $325 and got back $1050, for a net win of $725. 

Strategy

The player should make the 2nd and 3rd Shot wagers with any of the following hole cards.

A pair
Any two suited
Outside straight draw
Under pay tables 1 and 3, when a straight pays 5 to 1, the player should also make the 2nd and 3rd Shot wagers with an inside straight draw (including A/2 and K/A).

3 Shot Analysis

The following three tables show my analysis of the 3 Shot wager under pay tables 1 to 3. The "weight" column reflects how many hands over which the event can happen. In other words, when the player makes the 2nd Shot and 3rd Shot bet, he can get any given hand in one of three possible hands. However, when he folds, he folds just one hand.

The following table shows my analysis of the base game under pay table 1. The lower right cell shows a house edge of 7.62%.

3 Shot Return Table — Pay Table 1

Event	Pays	Weight	Combinations	Probability	Return
Mini royal	50	3	4	0.000181	0.027149
Straight flush	25	3	44	0.001991	0.149321
Three of a kind	10	3	52	0.002353	0.070588
Straight	5	3	720	0.032579	0.488688
Flush	2	3	1,096	0.049593	0.297557
Pair	1	3	2,472	0.111855	0.335566
Loser	-1	3	7,112	0.321810	-0.965430
Fold	-1	1	10,600	0.479638	-0.479638
Total	 	 	22,100	1.000000	-0.076199
The following table shows my analysis of the base game under pay table 2. The lower right cell shows a house edge of 6.33%.

3 Shot Return Table — Pay Table 2

Event	Pays	Weight	Combinations	Probability	Return
Mini royal	50	3	4	0.000181	0.027149
Straight flush	30	3	44	0.001991	0.179186
Three of a kind	20	3	52	0.002353	0.141176
Straight	4	3	496	0.022443	0.269321
Flush	2	3	1,096	0.049593	0.297557
Pair	1	3	2,136	0.096652	0.289955
Loser	-1	3	4,872	0.220452	-0.661357
Fold	-1	1	13,400	0.606335	-0.606335
Total	 	 	22,100	1.000000	-0.063348
The following table shows my analysis of the base game under pay table 3. The lower right cell shows a house edge of 5.18%.

3 Shot Return Table — Pay Table 3

Event	Pays	Weight	Combinations	Probability	Return
Mini royal	40	3	4	0.000181	0.021719
Straight flush	30	3	44	0.001991	0.179186
Three of a kind	10	3	52	0.002353	0.070588
Straight	5	3	720	0.032579	0.488688
Flush	2	3	1,096	0.049593	0.297557
Pair	1	3	2,472	0.111855	0.335566
Loser	-1	3	7,112	0.321810	-0.965430
Fold	-1	1	10,600	0.479638	-0.479638
Total	 	 	22,100	1.000000	-0.051765
The following table summarizes the house edge and element of risk under all three pay tables. As a reminder, the house edge is defined as the ratio of the expected player loss to the original wager. The element of risk is defined as the ratio of the expected player loss to the average total amount bet.

3 Shot Return Table — Pay Table 3

Pay
Table	House
Edge	Average
Wager	Element
of Risk
1	7.62%	2.040724	3.73%
2	6.33%	1.787330	3.54%
3	5.18%	2.040724	2.54%
5 Shot Analysis

The following table shows my analysis of Pay Table 1 of the 5 Shot side bet. The lower right cell shows a house edge of 8.17%.

5 Shot Return Table — Pay Table 1

Event	Pays	Combinations	Probability	Return
Royal flush	500	4	0.000002	0.000770
Straight flush	200	36	0.000014	0.002770
Four of a kind	50	624	0.000240	0.012005
Full house	40	3,744	0.001441	0.057623
Flush	30	5,108	0.001965	0.058962
Straight	20	10,200	0.003925	0.078493
Three of a kind	10	54,912	0.021128	0.211285
Two pair	2	123,552	0.047539	0.095078
Tens or better	1	422,400	0.162527	0.162527
Loser	-1	1,978,380	0.761220	-0.761220
Total	 	2,598,960	1.000000	-0.081708
The following table shows my analysis of Pay Table 2 of the 5 Shot side bet. The lower right cell shows a house edge of 7.68%.

5 Shot Return Table — Pay Table 2

Event	Pays	Combinations	Probability	Return
Royal flush	1000	4	0.000002	0.001539
Straight flush	500	36	0.000014	0.006926
Four of a kind	50	624	0.000240	0.012005
Full house	40	3,744	0.001441	0.057623
Flush	30	5,108	0.001965	0.058962
Straight	20	10,200	0.003925	0.078493
Three of a kind	10	54,912	0.021128	0.211285
Two pair	2	123,552	0.047539	0.095078
Tens or better	1	422,400	0.162527	0.162527
Loser	-1	1,978,380	0.761220	-0.761220
Total	 	2,598,960	1.000000	-0.076783
The following table shows my analysis of Pay Table 3 of the 5 Shot side bet. The lower right cell shows a house edge of 5.99%.

5 Shot Return Table — Pay Table 3

Event	Pays	Combinations	Probability	Return
Royal flush	1000	4	0.000002	0.001539
Straight flush	500	36	0.000014	0.006926
Four of a kind	200	624	0.000240	0.048019
Full house	100	3,744	0.001441	0.144058
Flush	50	5,108	0.001965	0.098270
Straight	10	10,200	0.003925	0.039246
Three of a kind	5	54,912	0.021128	0.105642
Two pair	2	123,552	0.047539	0.095078
Tens or better	1	422,400	0.162527	0.162527
Loser	-1	1,978,380	0.761220	-0.761220
Total	 	2,598,960	1.000000	-0.059915
